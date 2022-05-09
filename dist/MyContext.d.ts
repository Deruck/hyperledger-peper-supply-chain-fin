import { Context } from 'fabric-contract-api';
import { Enterprise } from './participants';
export declare class MyContext extends Context {
    appNum: number;
    enterprise: Enterprise;
    constructor();
    getNextAppId(): Promise<string>;
    updateAppNum(): Promise<void>;
    getEnterprise(): Promise<Enterprise>;
    initEnterprise(enterpriseId: string, enterpriseName: string, mspId: string): Promise<void>;
}
