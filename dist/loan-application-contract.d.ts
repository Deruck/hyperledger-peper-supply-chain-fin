import { Context, Contract } from 'fabric-contract-api';
export declare class LoanApplicationContract extends Contract {
    /************************************************************************
     *
     * Methods for All
     *
     ************************************************************************/
    ALL_queryApplicationById(ctx: Context, applicationId: string): Promise<string>;
    ALL_queryAllApplications(ctx: Context): Promise<string>;
    ALL_queryAllParticipants(ctx: Context): Promise<string>;
    /************************************************************************
     *
     * Methods for Enterprise
     *
     ************************************************************************/
    /**
     * 初始化融资企业信息
     */
    ETP_initEnterpriseIdentity(ctx: Context, enterpriseId: string, enterpriseName: string): Promise<string>;
    ETP_submitApplication(ctx: Context, platformID: string, createDate: string, loanAmount: number, pledgeAmount: number): Promise<string>;
    ETP_redeemPledge(ctx: Context, applicationId: string, redeemDate: string): Promise<string>;
    ETP_signPledge(ctx: Context, applicationId: string, signPledgeDate: string): Promise<string>;
    ETP_claimDefault(ctx: Context, applicationId: string, defaultDate: string): Promise<string>;
    ETP_queryApplicationStateById(ctx: Context, applicationId: string): Promise<string>;
    ETP_queryAllApplication(ctx: Context): Promise<string>;
    /************************************************************************
     *
     * Methods for Platform
     *
     ************************************************************************/
    PLT_initPlatformIdentity(ctx: Context, platformId: string, platformName: string): Promise<string>;
    PLT_rejectApplication(ctx: Context, applicationId: string, rejectDate: string): Promise<string>;
    PLT_issueWSAgreement(ctx: Context, applicationId: string, issueWSADate: string, warehouseId: string): Promise<string>;
    PLT_issueLoanAgreement(ctx: Context, applicationId: string, issueLoanAgreementDate: string, bankId: string): Promise<string>;
    PLT_sellPledge(ctx: Context, applicationId: string, sellPledgeDate: string): Promise<string>;
    PLT_queryAllApplication(ctx: Context): Promise<string>;
    /************************************************************************
     *
     * Methods for Bank
     *
     ************************************************************************/
    BNK_initBankIdentity(ctx: Context, bankId: string, bankName: string): Promise<string>;
    BNK_queryAllApplication(ctx: Context): Promise<string>;
    /************************************************************************
     *
     * Methods for Warehouse
     *
     ************************************************************************/
    WHS_initWarehouseIdentity(ctx: Context, warehouseId: string, warehouseName: string): Promise<string>;
    WHS_signPledge(ctx: Context, applicationId: string, signDate: string): Promise<string>;
    WHS_issueReceipt(ctx: Context, applicationId: string, issueDate: string): Promise<string>;
    WHS_queryAllApplication(ctx: Context): Promise<string>;
    /************************************************************************
     *
     * Private Methods
     *
     ************************************************************************/
    private _putStateFromObj;
    private _putStateFromStr;
    private _getAppNum;
    private _getMSPID;
    private _checkIdentity;
    private _applicationExists;
    private _getEnterprise;
    private _getPlatform;
    private _getBank;
    private _getWarehouse;
    private _getApplicationById;
    private _updateApplication;
}
