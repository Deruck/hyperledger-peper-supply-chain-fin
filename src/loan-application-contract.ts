import { assert } from 'console';
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { ClientIdentity } from 'fabric-shim';
import { LoanApplication, states } from './loan-application';
import { Enterprise, Platform, Bank, Warehouse } from './participants';
import { participantIdentity, stateKeys, keySet } from './utils'


@Info({title: 'LoanApplicationContract', description: 'My Smart Contract' })
export class LoanApplicationContract extends Contract {

/************************************************************************
 * 
 * Methods for All
 * 
 ************************************************************************/

    @Transaction(false)
    public async ALL_queryApplicationById(ctx: Context, applicationId: string): Promise<string> {
        return JSON.stringify(await this._getApplicationById(ctx, applicationId));
    }
    
    // todo: 用于调试，最后删除
    @Transaction(false)
    public async ALL_queryAllApplications(ctx: Context): Promise<string> {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (!keySet.has(key)) {
                allResults.push({ Key: key, Record: record });
            }
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    @Transaction(false)
    public async ALL_queryAllParticipants(ctx: Context): Promise<string> {
        const result = {
            "Enterprise": await this._getEnterprise(ctx),
            "Platform": await this._getPlatform(ctx),
            "Bank": await this._getBank(ctx),
            "Warehouse": await this._getWarehouse(ctx)
        }

        return JSON.stringify(result);
    }


/************************************************************************
 * 
 * Methods for Enterprise
 * 
 ************************************************************************/
    /**
     * 初始化融资企业信息
     */
    @Transaction(true)
    public async ETP_initEnterpriseIdentity(ctx: Context, enterpriseId: string, enterpriseName: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const mspId: string = await this._getMSPID(ctx);
        const enterprise: Enterprise = new Enterprise(enterpriseId, enterpriseName, mspId);
        await ctx.stub.putState(stateKeys.enterpriseKey, Buffer.from(JSON.stringify(enterprise)));
        return `Successfully initialize enterprise with id ${enterpriseId} and name ${enterpriseName}`;
    }

    @Transaction(true)
    public async ETP_submitApplication(
        ctx: Context,
        platformID: string,
        createDate: string,
        loanAmount: number,
        pledgeAmount: number
    ): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const enterprise: Enterprise = await this._getEnterprise(ctx);
        const appNum: number = await this._getAppNum(ctx);
        const applicationId: string = String(appNum + 1);
        const ifExist: boolean = await this._applicationExists(ctx, applicationId);
        if (ifExist) {
            throw new Error(`The application ${applicationId} already exists`);
        }
        const application = new LoanApplication(
            applicationId,
            enterprise.enterpriseId,
            platformID,
            createDate,
            pledgeAmount
        )
        application.loanAmount = loanAmount;
        await this._putStateFromObj(ctx, applicationId, application);
        console.info(`Successfully create application ${applicationId}`);
        await this._putStateFromStr(ctx, stateKeys.appNumKey, String(appNum + 1));
        return `Successfully create application ${applicationId}`;
    }

    @Transaction(true)
    public async ETP_redeemPledge(ctx: Context, applicationId: string, redeemDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId != (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`Enterprise Id dose not match.`);
        }
        if (application.currentState != states.effective) {
            throw new Error(`Can only submit this transaction with state ${states.effective}.`);
        }
        await this._updateApplication(application, states.returned);
        application.redeemDate = redeemDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully redeem pledge for application ${applicationId}`;
    }
    
    @Transaction(true)
    public async ETP_signPledge(ctx: Context, applicationId: string, signPledgeDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId != (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`Enterprise Id dose not match.`);
        }
        if (application.currentState != states.returned) {
            throw new Error(`Can only submit this transaction with state ${states.returned}.`);
        }
        await this._updateApplication(application, states.terminated);
        application.signPledgeDate = signPledgeDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully sign pledge for application ${applicationId}`;
    }

    @Transaction(true)
    public async ETP_claimDefault(ctx: Context, applicationId: string, defaultDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId != (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`Enterprise Id dose not match.`);
        }
        if (application.currentState != states.effective) {
            throw new Error(`Can only submit this transaction with state ${states.effective}.`);
        }
        await this._updateApplication(application, states.foreclosure);
        application.defaultDate = defaultDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully claim default for application ${applicationId}`;
    }


    @Transaction(false)
    public async ETP_queryApplicationStateById(ctx: Context, applicationId: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId !== (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`This is an application created by other enterprise.`);
        }
        const result = {
            "Application Id": applicationId,
            "Current State": application.currentState
        }
        return JSON.stringify(result);
    }

    @Transaction(false)
    public async ETP_queryAllApplication(ctx: Context): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.enterprise);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            var application: LoanApplication;
            try {
                application = JSON.parse(value.toString()) as LoanApplication;
            } catch (err) {
                console.log(err);
                continue;
            }
            if (!keySet.has(key) && application.creatorEnterpriseId == (await this._getEnterprise(ctx)).enterpriseId) {
                allResults.push({
                    "Application Id": application.applicationId,
                    "Application Info": application
                });
            }
        }
        return JSON.stringify(allResults);
    }


/************************************************************************
 * 
 * Methods for Platform
 * 
 ************************************************************************/
    
    @Transaction(true)
    public async PLT_initPlatformIdentity(ctx: Context, platformId: string, platformName: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.platform);
        const mspId: string = await this._getMSPID(ctx);
        const platform: Platform = new Platform(platformId, platformName, mspId);
        await ctx.stub.putState(stateKeys.platformKey, Buffer.from(JSON.stringify(platform)));
        return `Successfully initialize platform information with id ${platformId} and name ${platformName}`;
    }

    @Transaction(true)
    public async PLT_rejectApplication(ctx: Context, applicationId: string, rejectDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.platform);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != states.processing && application.currentState != states.risk_eval) {
            throw new Error(`Can only submit this transaction with state ${states.processing} or ${states.risk_eval}.`);
        }
        await this._updateApplication(application, states.declined);
        application.rejectedDate = rejectDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully rejecte application ${applicationId}`;
    }

    @Transaction(true)
    public async PLT_issueWSAgreement(ctx: Context, applicationId: string, issueWSADate: string, warehouseId: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.platform);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != states.processing) {
            throw new Error(`Can only submit this transaction with state ${states.processing}.`);
        }
        await this._updateApplication(application, states.transit);
        application.warehouseId = warehouseId;
        application.issueWSADate = issueWSADate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully issue warehouse service agreement for application ${applicationId}`;
    }

    @Transaction(true)
    public async PLT_issueLoanAgreement(ctx: Context, applicationId: string, issueLoanAgreementDate: string, bankId: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.platform);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != states.risk_eval) {
            throw new Error(`Can only submit this transaction with state ${states.risk_eval}.`);
        }
        await this._updateApplication(application, states.effective);
        application.bankId = bankId;
        application.issueLoanAgreementDate = issueLoanAgreementDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully issue loan agreement for application ${applicationId}`;
    }

    @Transaction(true)
    public async PLT_sellPledge(ctx: Context, applicationId: string, sellPledgeDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.platform);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != states.foreclosure) {
            throw new Error(`Can only submit this transaction with state ${states.foreclosure}.`);
        }
        await this._updateApplication(application, states.terminated);
        application.sellPledgeDate = sellPledgeDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully sell the pledge for application ${applicationId}`;
    }


    // todo: 信息聚合
    @Transaction(false)
    public async PLT_queryAllApplication(ctx: Context): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.platform);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            var application: LoanApplication;
            try {
                application = JSON.parse(value.toString()) as LoanApplication;
            } catch (err) {
                console.log(err);
                continue;
            }
            if (!keySet.has(key) && application.platformId == (await this._getPlatform(ctx)).platformId) {
                allResults.push({
                    "Application Id": application.applicationId,
                    "Application Info": application
                });
            }
        }
        return JSON.stringify(allResults);
    }


/************************************************************************
 * 
 * Methods for Bank
 * 
 ************************************************************************/

    @Transaction(true)
    public async BNK_initBankIdentity(ctx: Context, bankId: string, bankName: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.bank);
        const mspId: string = await this._getMSPID(ctx);
        const bank: Bank = new Bank(bankId, bankName, mspId);
        await ctx.stub.putState(stateKeys.bankKey, Buffer.from(JSON.stringify(bank)));
        return `Successfully initialize bank information with id ${bankId} and name ${bankName}`;
    }

    @Transaction(false)
    public async BNK_queryAllApplication(ctx: Context): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.bank);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            var application: LoanApplication;
            try {
                application = JSON.parse(value.toString()) as LoanApplication;
            } catch (err) {
                console.log(err);
                continue;
            }
            if (!keySet.has(key) && application.bankId == (await this._getBank(ctx)).bankId) {
                allResults.push({
                    "Application Id": application.applicationId,
                    "Application Info": application
                });
            }
        }
        return JSON.stringify(allResults);
    }



/************************************************************************
 * 
 * Methods for Warehouse
 * 
 ************************************************************************/

    @Transaction(true)
    public async WHS_initWarehouseIdentity(ctx: Context, warehouseId: string, warehouseName: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.warehouse);
        const mspId: string = await this._getMSPID(ctx);
        const warehouse: Warehouse = new Warehouse(warehouseId, warehouseName, mspId);
        await ctx.stub.putState(stateKeys.warehouseKey, Buffer.from(JSON.stringify(warehouse)));
        return `Successfully initialize warehouse information with id ${warehouseId} and name ${warehouseName}`;
    }

    @Transaction(true)
    public async WHS_signPledge(ctx: Context, applicationId: string, signDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.warehouse);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.warehouseId != (await this._getWarehouse(ctx)).warehouseId) {
            throw new Error(`Warehouse Id dose not match.`);
        }
        if (application.currentState != states.transit) {
            throw new Error(`Can only submit this transaction with state ${states.transit}.`);
        }
        await this._updateApplication(application, states.ple_eval);
        application.signDate = signDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully sign for the pledge for application ${applicationId}`;
    }
 
    @Transaction(true)
    public async WHS_issueReceipt(ctx: Context, applicationId: string, issueDate: string): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.warehouse);
        const application: LoanApplication = await this._getApplicationById(ctx, applicationId);
        if (application.warehouseId != (await this._getWarehouse(ctx)).warehouseId) {
            throw new Error(`Warehouse Id dose not match.`);
        }
        if (application.currentState != states.ple_eval) {
            throw new Error(`Can only submit this transaction with state ${states.ple_eval}.`);
        }
        application.issueReceiptDate = issueDate;
        await this._updateApplication(application, states.risk_eval);
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully issue the receipt for application ${applicationId}`;
    }


    @Transaction(false)
    public async WHS_queryAllApplication(ctx: Context): Promise<string> {
        await this._checkIdentity(ctx, participantIdentity.warehouse);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            var application: LoanApplication;
            try {
                application = JSON.parse(value.toString()) as LoanApplication;
            } catch (err) {
                console.log(err);
                continue;
            }
            if (!keySet.has(key) && application.warehouseId == (await this._getWarehouse(ctx)).warehouseId) {
                allResults.push({
                    "Application Id": application.applicationId,
                    "Application Info": application
                });
            }
        }
        return JSON.stringify(allResults);
    }
 



/************************************************************************
 * 
 * Private Methods
 * 
 ************************************************************************/

    private async _putStateFromObj(ctx:Context, key: string, value: any) {
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    }

    private async _putStateFromStr(ctx:Context, key: string, value: string) {
        await ctx.stub.putState(key, Buffer.from(value));
    }

    private async _getAppNum(ctx: Context): Promise<number> {
        const data: Uint8Array = await ctx.stub.getState(stateKeys.appNumKey);
        if (!!data && data.length > 0) {
            return parseInt(data.toString());
        } else {
            return 0;
        }
    }

    private async _getMSPID(ctx: Context): Promise<string> {
        const identity: ClientIdentity = ctx.clientIdentity;
        const mspId: string = identity.getMSPID();
        return mspId;
    }

    private async _checkIdentity(ctx: Context, checkIdentity: participantIdentity): Promise<void>{
        const mspId = await this._getMSPID(ctx);
        var checkMSPID: string;
        switch (checkIdentity) {
            case "enterprise":
                checkMSPID = "PepperEnterpriseMSP";
                if (mspId == checkMSPID) {
                    return;
                } else {
                    throw new Error(`Only an enterprise organization could submit this transaction.`);
                }
            case "platform":
                checkMSPID = "PlatformMSP";
                if (mspId == checkMSPID) {
                    return;
                } else {
                    throw new Error(`Only a platform organization could submit this transaction.`);
                }
            case "bank":
                checkMSPID = "BankMSP";
                if (mspId == checkMSPID) {
                    return;
                } else {
                    throw new Error(`Only a bank organization could submit this transaction.`);
                }
            case "warehouse":
                checkMSPID = "WarehouseMSP";
                if (mspId == checkMSPID) {
                    return;
                } else {
                    throw new Error(`Only a warehouse organization could submit this transaction.`);
                }
            default:
                throw new Error(`Wrong identity to check.`);
        }
    }

    private async _applicationExists(ctx: Context, applicationId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(applicationId);
        return (!!data && data.length > 0);
    }   

    private async _getEnterprise(ctx: Context): Promise<Enterprise> {
        const data: Uint8Array = await ctx.stub.getState(stateKeys.enterpriseKey);
        if (!!data && data.length > 0) {
            const enterprise: Enterprise = JSON.parse(data.toString()) as Enterprise;
            return enterprise;
        } else {
            throw new Error(`Enterprise information has not been initialized.`);
        }        
    }

    private async _getPlatform(ctx: Context): Promise<Platform> {
        const data: Uint8Array = await ctx.stub.getState(stateKeys.platformKey);
        if (!!data && data.length > 0) {
            const platform: Platform = JSON.parse(data.toString()) as Platform;
            return platform;
        } else {
            throw new Error(`Platform information has not been initialized.`);
        }        
    }

    private async _getBank(ctx: Context): Promise<Bank> {
        const data: Uint8Array = await ctx.stub.getState(stateKeys.bankKey);
        if (!!data && data.length > 0) {
            const bank: Bank = JSON.parse(data.toString()) as Bank;
            return bank;
        } else {
            throw new Error(`Bank information has not been initialized.`);
        }        
    }

    private async _getWarehouse(ctx: Context): Promise<Warehouse> {
        const data: Uint8Array = await ctx.stub.getState(stateKeys.warehouseKey);
        if (!!data && data.length > 0) {
            const warehouse: Warehouse = JSON.parse(data.toString()) as Warehouse;
            return warehouse;
        } else {
            throw new Error(`Warehouse information has not been initialized.`);
        }        
    }

    private async _getApplicationById(ctx: Context, applicationId: string): Promise<LoanApplication> {
        const exists: boolean = await this._applicationExists(ctx, applicationId);
        if (!exists) {
            throw new Error(`The application ${applicationId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(applicationId);
        const application: LoanApplication = JSON.parse(data.toString()) as LoanApplication;
        return application;
    }

    private async _updateApplication(application: LoanApplication, newState: states): Promise<void> {
        application.currentState = newState;
    }

}
