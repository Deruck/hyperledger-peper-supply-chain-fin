"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanApplicationContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
const loan_application_1 = require("./loan-application");
const participants_1 = require("./participants");
const utils_1 = require("./utils");
let LoanApplicationContract = class LoanApplicationContract extends fabric_contract_api_1.Contract {
    /************************************************************************
     *
     * Methods for All
     *
     ************************************************************************/
    async ALL_queryApplicationById(ctx, applicationId) {
        return JSON.stringify(await this._getApplicationById(ctx, applicationId));
    }
    // todo: 用于调试，最后删除
    async ALL_queryAllApplications(ctx) {
        var e_1, _a;
        const startKey = '';
        const endKey = '';
        const allResults = [];
        try {
            for (var _b = __asyncValues(ctx.stub.getStateByRange(startKey, endKey)), _c; _c = await _b.next(), !_c.done;) {
                const { key, value } = _c.value;
                const strValue = Buffer.from(value).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                }
                catch (err) {
                    console.log(err);
                    record = strValue;
                }
                if (!utils_1.keySet.has(key)) {
                    allResults.push({ Key: key, Record: record });
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }
    async ALL_queryAllParticipants(ctx) {
        const result = {
            "Enterprise": await this._getEnterprise(ctx),
            "Platform": await this._getPlatform(ctx),
            "Bank": await this._getBank(ctx),
            "Warehouse": await this._getWarehouse(ctx)
        };
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
    async ETP_initEnterpriseIdentity(ctx, enterpriseId, enterpriseName) {
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const mspId = await this._getMSPID(ctx);
        const enterprise = new participants_1.Enterprise(enterpriseId, enterpriseName, mspId);
        await ctx.stub.putState("enterpriseKey" /* enterpriseKey */, Buffer.from(JSON.stringify(enterprise)));
        return `Successfully initialize enterprise with id ${enterpriseId} and name ${enterpriseName}`;
    }
    async ETP_submitApplication(ctx, platformID, createDate, loanAmount, pledgeAmount) {
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const enterprise = await this._getEnterprise(ctx);
        const appNum = await this._getAppNum(ctx);
        const applicationId = String(appNum + 1);
        const ifExist = await this._applicationExists(ctx, applicationId);
        if (ifExist) {
            throw new Error(`The application ${applicationId} already exists`);
        }
        const application = new loan_application_1.LoanApplication(applicationId, enterprise.enterpriseId, platformID, createDate, pledgeAmount);
        application.loanAmount = loanAmount;
        await this._putStateFromObj(ctx, applicationId, application);
        console.info(`Successfully create application ${applicationId}`);
        await this._putStateFromStr(ctx, "appNumKey" /* appNumKey */, String(appNum + 1));
        return `Successfully create application ${applicationId}`;
    }
    async ETP_redeemPledge(ctx, applicationId, redeemDate) {
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId != (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`Enterprise Id dose not match.`);
        }
        if (application.currentState != "Effective" /* effective */) {
            throw new Error(`Can only submit this transaction with state ${"Effective" /* effective */}.`);
        }
        await this._updateApplication(application, "Pledge being Returned" /* returned */);
        application.redeemDate = redeemDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully redeem pledge for application ${applicationId}`;
    }
    async ETP_signPledge(ctx, applicationId, signPledgeDate) {
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId != (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`Enterprise Id dose not match.`);
        }
        if (application.currentState != "Pledge being Returned" /* returned */) {
            throw new Error(`Can only submit this transaction with state ${"Pledge being Returned" /* returned */}.`);
        }
        await this._updateApplication(application, "Agreement Terminated" /* terminated */);
        application.signPledgeDate = signPledgeDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully sign pledge for application ${applicationId}`;
    }
    async ETP_claimDefault(ctx, applicationId, defaultDate) {
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId != (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`Enterprise Id dose not match.`);
        }
        if (application.currentState != "Effective" /* effective */) {
            throw new Error(`Can only submit this transaction with state ${"Effective" /* effective */}.`);
        }
        await this._updateApplication(application, "Foreclosure" /* foreclosure */);
        application.defaultDate = defaultDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully claim default for application ${applicationId}`;
    }
    async ETP_queryApplicationStateById(ctx, applicationId) {
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.creatorEnterpriseId !== (await this._getEnterprise(ctx)).enterpriseId) {
            throw new Error(`This is an application created by other enterprise.`);
        }
        const result = {
            "Application Id": applicationId,
            "Current State": application.currentState
        };
        return JSON.stringify(result);
    }
    async ETP_queryAllApplication(ctx) {
        var e_2, _a;
        await this._checkIdentity(ctx, "enterprise" /* enterprise */);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        try {
            for (var _b = __asyncValues(ctx.stub.getStateByRange(startKey, endKey)), _c; _c = await _b.next(), !_c.done;) {
                const { key, value } = _c.value;
                var application;
                try {
                    application = JSON.parse(value.toString());
                }
                catch (err) {
                    console.log(err);
                    continue;
                }
                if (!utils_1.keySet.has(key) && application.creatorEnterpriseId == (await this._getEnterprise(ctx)).enterpriseId) {
                    allResults.push({
                        "Application Id": application.applicationId,
                        "Application Info": application
                    });
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return JSON.stringify(allResults);
    }
    /************************************************************************
     *
     * Methods for Platform
     *
     ************************************************************************/
    async PLT_initPlatformIdentity(ctx, platformId, platformName) {
        await this._checkIdentity(ctx, "platform" /* platform */);
        const mspId = await this._getMSPID(ctx);
        const platform = new participants_1.Platform(platformId, platformName, mspId);
        await ctx.stub.putState("platformKey" /* platformKey */, Buffer.from(JSON.stringify(platform)));
        return `Successfully initialize platform information with id ${platformId} and name ${platformName}`;
    }
    async PLT_rejectApplication(ctx, applicationId, rejectDate) {
        await this._checkIdentity(ctx, "platform" /* platform */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != "Application Processing" /* processing */ && application.currentState != "Loan Risk Evaluation" /* risk_eval */) {
            throw new Error(`Can only submit this transaction with state ${"Application Processing" /* processing */} or ${"Loan Risk Evaluation" /* risk_eval */}.`);
        }
        await this._updateApplication(application, "Declined" /* declined */);
        application.rejectedDate = rejectDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully rejecte application ${applicationId}`;
    }
    async PLT_issueWSAgreement(ctx, applicationId, issueWSADate, warehouseId) {
        await this._checkIdentity(ctx, "platform" /* platform */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != "Application Processing" /* processing */) {
            throw new Error(`Can only submit this transaction with state ${"Application Processing" /* processing */}.`);
        }
        await this._updateApplication(application, "Pledge in Transit" /* transit */);
        application.warehouseId = warehouseId;
        application.issueWSADate = issueWSADate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully issue warehouse service agreement for application ${applicationId}`;
    }
    async PLT_issueLoanAgreement(ctx, applicationId, issueLoanAgreementDate, bankId) {
        await this._checkIdentity(ctx, "platform" /* platform */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != "Loan Risk Evaluation" /* risk_eval */) {
            throw new Error(`Can only submit this transaction with state ${"Loan Risk Evaluation" /* risk_eval */}.`);
        }
        await this._updateApplication(application, "Effective" /* effective */);
        application.bankId = bankId;
        application.issueLoanAgreementDate = issueLoanAgreementDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully issue loan agreement for application ${applicationId}`;
    }
    async PLT_sellPledge(ctx, applicationId, sellPledgeDate) {
        await this._checkIdentity(ctx, "platform" /* platform */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.platformId != (await this._getPlatform(ctx)).platformId) {
            throw new Error(`Platform Id dose not match.`);
        }
        if (application.currentState != "Foreclosure" /* foreclosure */) {
            throw new Error(`Can only submit this transaction with state ${"Foreclosure" /* foreclosure */}.`);
        }
        await this._updateApplication(application, "Agreement Terminated" /* terminated */);
        application.sellPledgeDate = sellPledgeDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully sell the pledge for application ${applicationId}`;
    }
    // todo: 信息聚合
    async PLT_queryAllApplication(ctx) {
        var e_3, _a;
        await this._checkIdentity(ctx, "platform" /* platform */);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        try {
            for (var _b = __asyncValues(ctx.stub.getStateByRange(startKey, endKey)), _c; _c = await _b.next(), !_c.done;) {
                const { key, value } = _c.value;
                var application;
                try {
                    application = JSON.parse(value.toString());
                }
                catch (err) {
                    console.log(err);
                    continue;
                }
                if (!utils_1.keySet.has(key) && application.platformId == (await this._getPlatform(ctx)).platformId) {
                    allResults.push({
                        "Application Id": application.applicationId,
                        "Application Info": application
                    });
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return JSON.stringify(allResults);
    }
    /************************************************************************
     *
     * Methods for Bank
     *
     ************************************************************************/
    async BNK_initBankIdentity(ctx, bankId, bankName) {
        await this._checkIdentity(ctx, "bank" /* bank */);
        const mspId = await this._getMSPID(ctx);
        const bank = new participants_1.Bank(bankId, bankName, mspId);
        await ctx.stub.putState("bankKey" /* bankKey */, Buffer.from(JSON.stringify(bank)));
        return `Successfully initialize bank information with id ${bankId} and name ${bankName}`;
    }
    async BNK_queryAllApplication(ctx) {
        var e_4, _a;
        await this._checkIdentity(ctx, "bank" /* bank */);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        try {
            for (var _b = __asyncValues(ctx.stub.getStateByRange(startKey, endKey)), _c; _c = await _b.next(), !_c.done;) {
                const { key, value } = _c.value;
                var application;
                try {
                    application = JSON.parse(value.toString());
                }
                catch (err) {
                    console.log(err);
                    continue;
                }
                if (!utils_1.keySet.has(key) && application.bankId == (await this._getBank(ctx)).bankId) {
                    allResults.push({
                        "Application Id": application.applicationId,
                        "Application Info": application
                    });
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return JSON.stringify(allResults);
    }
    /************************************************************************
     *
     * Methods for Warehouse
     *
     ************************************************************************/
    async WHS_initWarehouseIdentity(ctx, warehouseId, warehouseName) {
        await this._checkIdentity(ctx, "warehouse" /* warehouse */);
        const mspId = await this._getMSPID(ctx);
        const warehouse = new participants_1.Warehouse(warehouseId, warehouseName, mspId);
        await ctx.stub.putState("warehouseKey" /* warehouseKey */, Buffer.from(JSON.stringify(warehouse)));
        return `Successfully initialize warehouse information with id ${warehouseId} and name ${warehouseName}`;
    }
    async WHS_signPledge(ctx, applicationId, signDate) {
        await this._checkIdentity(ctx, "warehouse" /* warehouse */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.warehouseId != (await this._getWarehouse(ctx)).warehouseId) {
            throw new Error(`Warehouse Id dose not match.`);
        }
        if (application.currentState != "Pledge in Transit" /* transit */) {
            throw new Error(`Can only submit this transaction with state ${"Pledge in Transit" /* transit */}.`);
        }
        await this._updateApplication(application, "Pledge Evaluation" /* ple_eval */);
        application.signDate = signDate;
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully sign for the pledge for application ${applicationId}`;
    }
    async WHS_issueReceipt(ctx, applicationId, issueDate) {
        await this._checkIdentity(ctx, "warehouse" /* warehouse */);
        const application = await this._getApplicationById(ctx, applicationId);
        if (application.warehouseId != (await this._getWarehouse(ctx)).warehouseId) {
            throw new Error(`Warehouse Id dose not match.`);
        }
        if (application.currentState != "Pledge Evaluation" /* ple_eval */) {
            throw new Error(`Can only submit this transaction with state ${"Pledge Evaluation" /* ple_eval */}.`);
        }
        application.issueReceiptDate = issueDate;
        await this._updateApplication(application, "Loan Risk Evaluation" /* risk_eval */);
        await this._putStateFromObj(ctx, applicationId, application);
        return `Successfully issue the receipt for application ${applicationId}`;
    }
    async WHS_queryAllApplication(ctx) {
        var e_5, _a;
        await this._checkIdentity(ctx, "warehouse" /* warehouse */);
        const startKey = '';
        const endKey = '';
        const allResults = [];
        try {
            for (var _b = __asyncValues(ctx.stub.getStateByRange(startKey, endKey)), _c; _c = await _b.next(), !_c.done;) {
                const { key, value } = _c.value;
                var application;
                try {
                    application = JSON.parse(value.toString());
                }
                catch (err) {
                    console.log(err);
                    continue;
                }
                if (!utils_1.keySet.has(key) && application.warehouseId == (await this._getWarehouse(ctx)).warehouseId) {
                    allResults.push({
                        "Application Id": application.applicationId,
                        "Application Info": application
                    });
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return JSON.stringify(allResults);
    }
    /************************************************************************
     *
     * Private Methods
     *
     ************************************************************************/
    async _putStateFromObj(ctx, key, value) {
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    }
    async _putStateFromStr(ctx, key, value) {
        await ctx.stub.putState(key, Buffer.from(value));
    }
    async _getAppNum(ctx) {
        const data = await ctx.stub.getState("appNumKey" /* appNumKey */);
        if (!!data && data.length > 0) {
            return parseInt(data.toString());
        }
        else {
            return 0;
        }
    }
    async _getMSPID(ctx) {
        const identity = ctx.clientIdentity;
        const mspId = identity.getMSPID();
        return mspId;
    }
    async _checkIdentity(ctx, checkIdentity) {
        const mspId = await this._getMSPID(ctx);
        var checkMSPID;
        switch (checkIdentity) {
            case "enterprise":
                checkMSPID = "PepperEnterpriseMSP";
                if (mspId == checkMSPID) {
                    return;
                }
                else {
                    throw new Error(`Only an enterprise organization could submit this transaction.`);
                }
            case "platform":
                checkMSPID = "PlatformMSP";
                if (mspId == checkMSPID) {
                    return;
                }
                else {
                    throw new Error(`Only a platform organization could submit this transaction.`);
                }
            case "bank":
                checkMSPID = "BankMSP";
                if (mspId == checkMSPID) {
                    return;
                }
                else {
                    throw new Error(`Only a bank organization could submit this transaction.`);
                }
            case "warehouse":
                checkMSPID = "WarehouseMSP";
                if (mspId == checkMSPID) {
                    return;
                }
                else {
                    throw new Error(`Only a warehouse organization could submit this transaction.`);
                }
            default:
                throw new Error(`Wrong identity to check.`);
        }
    }
    async _applicationExists(ctx, applicationId) {
        const data = await ctx.stub.getState(applicationId);
        return (!!data && data.length > 0);
    }
    async _getEnterprise(ctx) {
        const data = await ctx.stub.getState("enterpriseKey" /* enterpriseKey */);
        if (!!data && data.length > 0) {
            const enterprise = JSON.parse(data.toString());
            return enterprise;
        }
        else {
            throw new Error(`Enterprise information has not been initialized.`);
        }
    }
    async _getPlatform(ctx) {
        const data = await ctx.stub.getState("platformKey" /* platformKey */);
        if (!!data && data.length > 0) {
            const platform = JSON.parse(data.toString());
            return platform;
        }
        else {
            throw new Error(`Platform information has not been initialized.`);
        }
    }
    async _getBank(ctx) {
        const data = await ctx.stub.getState("bankKey" /* bankKey */);
        if (!!data && data.length > 0) {
            const bank = JSON.parse(data.toString());
            return bank;
        }
        else {
            throw new Error(`Bank information has not been initialized.`);
        }
    }
    async _getWarehouse(ctx) {
        const data = await ctx.stub.getState("warehouseKey" /* warehouseKey */);
        if (!!data && data.length > 0) {
            const warehouse = JSON.parse(data.toString());
            return warehouse;
        }
        else {
            throw new Error(`Warehouse information has not been initialized.`);
        }
    }
    async _getApplicationById(ctx, applicationId) {
        const exists = await this._applicationExists(ctx, applicationId);
        if (!exists) {
            throw new Error(`The application ${applicationId} does not exist`);
        }
        const data = await ctx.stub.getState(applicationId);
        const application = JSON.parse(data.toString());
        return application;
    }
    async _updateApplication(application, newState) {
        application.currentState = newState;
    }
};
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ALL_queryApplicationById", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ALL_queryAllApplications", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ALL_queryAllParticipants", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_initEnterpriseIdentity", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_submitApplication", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_redeemPledge", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_signPledge", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_claimDefault", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_queryApplicationStateById", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "ETP_queryAllApplication", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "PLT_initPlatformIdentity", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "PLT_rejectApplication", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "PLT_issueWSAgreement", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "PLT_issueLoanAgreement", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "PLT_sellPledge", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "PLT_queryAllApplication", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "BNK_initBankIdentity", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "BNK_queryAllApplication", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "WHS_initWarehouseIdentity", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "WHS_signPledge", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "WHS_issueReceipt", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], LoanApplicationContract.prototype, "WHS_queryAllApplication", null);
LoanApplicationContract = __decorate([
    fabric_contract_api_1.Info({ title: 'LoanApplicationContract', description: 'My Smart Contract' })
], LoanApplicationContract);
exports.LoanApplicationContract = LoanApplicationContract;
//# sourceMappingURL=loan-application-contract.js.map