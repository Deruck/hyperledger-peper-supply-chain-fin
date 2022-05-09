"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Warehouse = exports.Bank = exports.Platform = exports.Enterprise = void 0;
class Enterprise {
    constructor(enterpriseId, enterpriseName, mspId) {
        this.enterpriseId = enterpriseId;
        this.enterpriseName = enterpriseName;
        this.mspId = mspId;
    }
}
exports.Enterprise = Enterprise;
class Platform {
    constructor(platformId, platformName, mspId) {
        this.platformId = platformId;
        this.platformName = platformName;
        this.mspId = mspId;
    }
}
exports.Platform = Platform;
class Bank {
    constructor(bankId, bankName, mspId) {
        this.bankId = bankId;
        this.bankName = bankName;
        this.mspId = mspId;
    }
}
exports.Bank = Bank;
class Warehouse {
    constructor(warehouseId, warehouseName, mspId) {
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
        this.mspId = mspId;
    }
}
exports.Warehouse = Warehouse;
//# sourceMappingURL=participants.js.map