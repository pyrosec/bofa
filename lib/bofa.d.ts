import { CookieJar } from "tough-cookie";
export declare class BofAClient {
    publicKey: string;
    ssoKey: string;
    encryptedGUID: string;
    traceToken: string;
    jar: CookieJar;
    deviceInfo: string;
    deviceId: string;
    deviceModel: string;
    deviceKey: string;
    gatewayCSRFToken: string;
    sessionId: string;
    securedContactPoint: any;
    ecid: string;
    tokenId: string;
    credentials: string | null;
    nextItemToken: string | null;
    constructor(options?: any);
    _splitCredentials(): {
        username: string;
        password: string;
    };
    toObject(): {
        cookie: any;
        credentials: string;
        nextItemToken: string;
        gatewayCSRFToken: string;
        publicKey: string;
        ecid: string;
        encryptedGUID: string;
        ssoKey: string;
        traceToken: string;
        tokenId: string;
        securedContactPoint: any;
        deviceId: string;
        deviceInfo: string;
        deviceKey: string;
        deviceModel: string;
    };
    toJSON(): string;
    static fromObject(data: any): BofAClient;
    static fromJSON(s: any): BofAClient;
    static initialize(options?: {}): BofAClient;
    collectAuthHeaders(response: any): Promise<void>;
    _call(path: any, method: any, data?: any, extraHeaders?: {}): any;
    firstUse(): Promise<any>;
    initMobileAuth(): Promise<any>;
    zelleHistory(o?: any): Promise<any>;
    transferDetails(): Promise<any>;
    getAlias(): Promise<any>;
    request({ opCode, alias, memotext, name, requestor, amount }: {
        opCode: any;
        alias: any;
        memotext: any;
        name: any;
        requestor: any;
        amount: any;
    }): Promise<any>;
    accountsOverview(): Promise<any>;
    sendOtp(): Promise<any>;
    validateOtp({ otp }: {
        otp: any;
    }): Promise<any>;
    zelleInit(): Promise<any>;
    getCards(): Promise<any>;
    accountNumber(): Promise<any>;
    recipients({ numInZelleBucket1, opCode }: {
        numInZelleBucket1: any;
        opCode: any;
    }): Promise<any>;
    transfer({ opCode, duplicateFlag, amount, displayName, adx, payeeId, nickName, payeeAliasToken, }: {
        opCode: any;
        duplicateFlag: any;
        amount: any;
        displayName: any;
        adx: any;
        payeeId: any;
        nickName: any;
        payeeAliasToken: any;
    }): Promise<any>;
    finishLogin({ otp, register }: {
        otp: any;
        register: any;
    }): Promise<any>;
    start(): Promise<any>;
    resumeSession(): Promise<any>;
    registerDevice(): Promise<any>;
    dashboard(): Promise<any>;
    txHistory({ accountToken, subAccountToken }: {
        accountToken: any;
        subAccountToken: any;
    }): Promise<any>;
    completeTxHistory({ accountToken, subAccountToken }: {
        accountToken: any;
        subAccountToken: any;
    }): Promise<any>;
    cardholders({ accountToken }: {
        accountToken: any;
    }): Promise<any>;
    next({ nextItemToken, accountToken, subAccountToken }: {
        nextItemToken: any;
        accountToken: any;
        subAccountToken: any;
    }): Promise<any>;
    retrieveSignInHistory(): Promise<any>;
    eligibleArrangements({ accountToken, featureName, filter }: {
        accountToken: any;
        featureName: any;
        filter: any;
    }): Promise<any>;
    activate({ adx, cvv, expirationMonth, expirationYear }: {
        adx: any;
        cvv: any;
        expirationMonth: any;
        expirationYear: any;
    }): Promise<any>;
    createOneTimeToken({ softToken }: {
        softToken: any;
    }): Promise<any>;
    addRecipient({ accountNumber, adx, firstName, lastName, }: {
        accountNumber: any;
        adx: any;
        firstName: any;
        lastName: any;
    }): Promise<any>;
    viewRecipients(): Promise<any>;
    _getPublicKey(type: any): string;
    encrypt({ buffer }: {
        buffer: any;
    }): string;
    signIn({ username, password }: {
        username: any;
        password: any;
    }): Promise<any>;
}
