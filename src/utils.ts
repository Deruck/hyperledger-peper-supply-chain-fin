export const enum participantIdentity {
    enterprise = "enterprise",
    platform = "platform",
    bank = "bank", 
    warehouse = "warehouse"
}

export const enum stateKeys {
    enterpriseKey = "enterpriseKey",
    platformKey = "platformKey",
    bankKey = "bankKey",
    warehouseKey = "warehouseKey",
    appNumKey = "appNumKey"
}

export const keySet: Set<string> = new Set([
    stateKeys.enterpriseKey,
    stateKeys.platformKey,
    stateKeys.bankKey,
    stateKeys.warehouseKey,
    stateKeys.appNumKey
]);