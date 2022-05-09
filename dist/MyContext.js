"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyContext = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
const participants_1 = require("./participants");
class MyContext extends fabric_contract_api_1.Context {
    constructor() {
        super();
        this.appNum = 0;
        this.enterprise = null;
    }
    async getNextAppId() {
        return String(this.appNum + 1);
    }
    async updateAppNum() {
        this.appNum += 1;
    }
    async getEnterprise() {
        if (this.enterprise === null) {
            throw new Error(`00000000`);
        }
        return this.enterprise;
    }
    async initEnterprise(enterpriseId, enterpriseName, mspId) {
        this.enterprise = new participants_1.Enterprise(enterpriseId, enterpriseName, mspId);
        if (this.enterprise === null) {
            throw new Error(`00000000`);
        }
    }
}
exports.MyContext = MyContext;
//# sourceMappingURL=MyContext.js.map