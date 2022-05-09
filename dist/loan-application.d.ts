export declare const enum states {
    processing = "Application Processing",
    transit = "Pledge in Transit",
    ple_eval = "Pledge Evaluation",
    risk_eval = "Loan Risk Evaluation",
    effective = "Effective",
    returned = "Pledge being Returned",
    foreclosure = "Foreclosure",
    terminated = "Agreement Terminated",
    declined = "Declined"
}
export declare class LoanApplication {
    applicationId: string;
    createDate: string;
    currentState: states;
    pledgeAmount: number;
    creatorEnterpriseId: string;
    platformId: string;
    warehouseId?: string;
    bankId?: string;
    rejectedDate?: string;
    issueWSADate?: string;
    signDate?: string;
    issueReceiptDate?: string;
    issueLoanAgreementDate?: string;
    redeemDate?: string;
    signPledgeDate?: string;
    defaultDate?: string;
    sellPledgeDate?: string;
    storageWarehouseId?: string;
    lenderBankId?: string;
    application_state?: string;
    warehouseServiceAgreement?: string;
    riskEvaluation?: string;
    loanAgreement?: string;
    queryDate?: string;
    loanAmount?: number;
    loanState?: string;
    pledgePrice?: string;
    sellPrice?: string;
    constructor(applicationId: string, creatorEnterpriseId: string, platformId: string, createDate: string, pledgeAmount: number);
}
