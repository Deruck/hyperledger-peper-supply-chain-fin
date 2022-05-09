export class Enterprise {
    public enterpriseId: string;
    public enterpriseName: string;
    public mspId: string;

    constructor(enterpriseId: string, enterpriseName: string, mspId: string) {
        this.enterpriseId = enterpriseId;
        this.enterpriseName = enterpriseName;
        this.mspId = mspId;
    }
}

export class Platform {
    public platformId: string;
    public platformName: string;
    public mspId: string;
    public guarenteeAmount?: number;

    constructor(platformId: string, platformName: string, mspId: string) {
        this.platformId = platformId;
        this.platformName = platformName;
        this.mspId = mspId;
    }
}

export class Bank {
    public bankId: string;
    public bankName: string;
    public mspId: string;

    constructor(bankId: string, bankName: string, mspId: string) {
        this.bankId = bankId;
        this.bankName = bankName;
        this.mspId = mspId;
    }
}

export class Warehouse {
    public warehouseId: string;
    public warehouseName: string;
    public mspId: string;

    constructor(warehouseId: string, warehouseName: string, mspId: string) {
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
        this.mspId = mspId;
    }
}