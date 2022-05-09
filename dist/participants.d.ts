export declare class Enterprise {
    enterpriseId: string;
    enterpriseName: string;
    mspId: string;
    constructor(enterpriseId: string, enterpriseName: string, mspId: string);
}
export declare class Platform {
    platformId: string;
    platformName: string;
    mspId: string;
    guarenteeAmount?: number;
    constructor(platformId: string, platformName: string, mspId: string);
}
export declare class Bank {
    bankId: string;
    bankName: string;
    mspId: string;
    constructor(bankId: string, bankName: string, mspId: string);
}
export declare class Warehouse {
    warehouseId: string;
    warehouseName: string;
    mspId: string;
    constructor(warehouseId: string, warehouseName: string, mspId: string);
}
