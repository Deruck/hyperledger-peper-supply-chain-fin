import { Context } from 'fabric-contract-api';
import { Enterprise } from './participants';

export class MyContext extends Context {
    public appNum: number;
    public enterprise: Enterprise;
    
    constructor() {
        super();
        this.appNum = 0;
        this.enterprise = null;
    }

    public async getNextAppId(): Promise<string> {
        return String(this.appNum + 1);
    }

    public async updateAppNum(): Promise<void> {
        this.appNum += 1;
    }

    public async getEnterprise(): Promise<Enterprise> {
        if (this.enterprise === null) {
            throw new Error(`00000000`);
        }
        return this.enterprise;
    }

    public async initEnterprise(enterpriseId: string, enterpriseName: string, mspId: string): Promise<void> {
        this.enterprise = new Enterprise(enterpriseId, enterpriseName, mspId);
        if (this.enterprise === null) {
            throw new Error(`00000000`);
        }
    }
}