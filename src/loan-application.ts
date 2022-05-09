import { Object } from 'fabric-contract-api';

export const enum states {
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

@Object()
export class LoanApplication {

    public applicationId: string;
    public createDate: string;
    public currentState: states;
    public pledgeAmount: number;
    public creatorEnterpriseId: string;
    public platformId: string;
    public warehouseId?: string;
    public bankId?: string;

    public rejectedDate?: string;
    public issueWSADate?: string;
    public signDate?: string;
    public issueReceiptDate?: string;
    public issueLoanAgreementDate?: string;
    public redeemDate?: string;
    public signPledgeDate?: string;
    public defaultDate?: string;
    public sellPledgeDate?: string;

    public storageWarehouseId?: string;
    public lenderBankId?: string;
    public application_state?: string;
    public warehouseServiceAgreement?: string;
    public riskEvaluation?: string;
    public loanAgreement?: string;
    public queryDate?: string;
    public loanAmount?: number;
    public loanState?: string;
    public pledgePrice?: string;
    public sellPrice?: string;

    constructor(
        applicationId: string,
        creatorEnterpriseId: string,
        platformId: string,
        createDate: string,
        pledgeAmount: number
    ) {
        this.applicationId = applicationId;
        this.creatorEnterpriseId = creatorEnterpriseId;
        this.platformId = platformId;
        this.createDate = createDate;
        this.currentState = states.processing;
        this.pledgeAmount = pledgeAmount;
    }
}

