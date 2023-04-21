import axios from "axios";
import DEVICE_LIST from "./data/fingerprints.json";
import { getLogger } from "./logger";
import moment from "moment";
import tos from "./data/tos.json";
import filterRules from "./data/filterRules.json";
import tiltObj from "./data/filterRules.json";
import dashboard from "./data/dashboard.json";
import offerState from "./data/offerState.json";
import randomBytes from "random-bytes";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import crypto from "crypto";

const randomDevice = () => {
  return DEVICE_LIST[Math.floor(Math.random() * DEVICE_LIST.length)];
};

const logger = getLogger();
const dUp = "OnePlus ";
const dLo = "oneplus ";

const randomDeviceInfo = () => randomDevice().device;

const randomDeviceId = () => randomBytes.sync(8).toString("hex");

//base headers
const DEFAULT_HEADERS = {
  "Supports-Localization": "TRUE",
  "MDA-Device-Language": "en-US",
  "BE-DEVICE-OS": "12",
  channel: "MBDA",
  "BE-APP-ORIGIN": "MDA",
  "device-id":
    "ipAddress=&fsoToken=&browserString=Mozilla/5.0 (Linux; U; Android 12; en-US) MDA/22.09.04&cookieToken=",
  "User-Agent": "Mozilla/5.0 (Linux; U; Android 12; en-US) MDA/22.09.04",
  platformType: "SMRTPH",
  "x-crt-app-info": "MobileApp MobileBanking AndroidHandset 12",
  AppBrand: "BOA",
  "BE-DEVICE-TYPE": "Android",
  deviceOS: "Android 12",
  "voice-accessibility": "false",
  buildNumber: "2083090603",
  "x-crt-app-version": "22.09.04",
  ClientAIT: "41339",
  "APP-NAME": "NBAA",
  "device-type": "GOOGLE",
  Accept: "application/json",
  Connection: "Keep-Alive",
  "Cache-Control": "no-store",
  "Accept-Language": "en-US",
  "Accept-Encoding": "gzip",
};
const http = wrapper(axios);

export class BofAClient {
  public publicKey: string;
  public ssoKey: string;
  public encryptedGUID: string;
  public traceToken: string;
  public jar: CookieJar;
  public deviceInfo: string;
  public deviceId: string;
  public deviceModel: string;
  public deviceKey: string;
  public gatewayCSRFToken: string;
  public sessionId: string;
  public securedContactPoint: any = {};
  public ecid: string;
  public tokenId: string;
  public credentials: string | null;
  public nextItemToken: string | null;
  constructor(options: any = {}) {
    const info = randomDeviceInfo();
    this.deviceInfo = options.deviceInfo || dUp + info;
    this.deviceModel = options.deviceModel || dUp + dLo + info;
    this.deviceId = options.deviceId || randomDeviceId();
    this.deviceKey = options.deviceKey || this.deviceId + "-GOOGLE";
    this.jar =
      (options.cookie && CookieJar.deserializeSync(options.cookie)) ||
      new CookieJar();
    this.gatewayCSRFToken = options.gatewayCSRFToken || null;
    this.publicKey = options.publicKey || null;
    this.encryptedGUID = options.encryptedGUID || null;
    this.securedContactPoint = options.securedContactPoint || {};
    this.ecid = options.ecid || null;
    this.tokenId = options.tokenId || null;
    this.traceToken = options.traceToken || null;
    this.ssoKey = options.ssoKey || null;
    this.nextItemToken = options.nextItemToken || null;
    this.credentials = options.credentials || null;
  }
  _splitCredentials() {
    const [username, ...password] = this.credentials.split(":");
    return {
      username,
      password: password.join(":"),
    };
  }
  toObject() {
    return {
      cookie: this?.jar.toJSON(),
      credentials: this.credentials || null,
      nextItemToken: this.nextItemToken,
      gatewayCSRFToken: this?.gatewayCSRFToken,
      publicKey: this?.publicKey,
      ecid: this?.ecid,
      encryptedGUID: this?.encryptedGUID,
      ssoKey: this?.ssoKey,
      traceToken: this?.traceToken,
      tokenId: this?.tokenId,
      securedContactPoint: this?.securedContactPoint,
      deviceId: this.deviceId,
      deviceInfo: this.deviceInfo,
      deviceKey: this.deviceKey,
      deviceModel: this.deviceModel,
    };
  }
  toJSON() {
    return JSON.stringify(this.toObject(), null, 2);
  }
  static fromObject(data) {
    const result = new this(data);
    return result;
  }
  static fromJSON(s) {
    return this.fromObject(JSON.parse(s));
  }

  static initialize(options = {}) {
    const result = new this(options);
    return result;
  }

  async collectAuthHeaders(response) {
    const authResponse = response.data?.authenticationInfo;
    const encryptedGUID =
      authResponse?.onlineToken?.tokenSets?.[1]?.value?.cipherData?.value;
    const token = response.headers?.gatewaycsrftoken;
    const key = response.data?.authenticationResponse?.sessionPublicKey;
    const scp = authResponse?.stepUpSecuredContactPoints;
    const accounts = response.data?.accountsInfo?.payload?.accounts;
    const tokenId = accounts?.[0]?.identifier?.adx;
    const tracer = response?.data?.additionalInfo?.potacConsentTraceId;
    const ssoKey =
      response?.data?.stepUpToken?.processContext?.ssoEncryptionKey;
    if (encryptedGUID) {
      this.encryptedGUID = encryptedGUID;
    }
    if (tracer) this.traceToken = tracer;
    if (ssoKey) this.ssoKey = ssoKey;

    let ecidentifier;

    for (var i = 0; i < 2; i++) {
      ecidentifier = authResponse?.vendorTokenList?.[0]?.identifier;
    }

    if (this.jar.toJSON().cookies[0].key == "GSID") {
      this.sessionId = this.jar.toJSON().cookies[0].value;
    }

    if (scp?.[0] && scp?.[1] && this.securedContactPoint) {
      if (scp[0].deliveryMethod == "TEXT") {
        this.securedContactPoint["securedContactPoint"] = scp[0];
        this.securedContactPoint["securedContactPoint"].authenticationType =
          "AUTHCODE";
        this.securedContactPoint["securedContactPoint"].algorithm = "AES";
        this.securedContactPoint[
          "securedContactPoint"
        ].maskedContactPoint.description = "";
      } else {
        this.securedContactPoint["securedContactPoint"] = scp[1];
        this.securedContactPoint["securedContactPoint"].authenticationType =
          "AUTHCODE";
        this.securedContactPoint["securedContactPoint"].algorithm = "AES";
        this.securedContactPoint[
          "securedContactPoint"
        ].maskedContactPoint.description = "";
      }
    }

    if (token) {
      this.gatewayCSRFToken = token;
    }
    if (key) {
      this.publicKey = key;
    }
    if (ecidentifier) {
      this.ecid = ecidentifier;
    }
    if (tokenId) {
      this.tokenId = tokenId;
    }
  }

  async _call(path, method, data = null, extraHeaders = {}) {
    try {
      const response = await http({
        url: path,
        method: method,
        headers: Object.assign(
          {},
          DEFAULT_HEADERS,
          {
            gatewayCSRFToken: this.gatewayCSRFToken,
            deviceId: this.deviceId,
            deviceKey: this.deviceKey,
            "BE-DEVICE-MODEL-DETAIL": this.deviceInfo,
            deviceModel: this.deviceModel,
          },
          extraHeaders
        ),
        jar: this.jar,
        data,
        responseType: "json",
      });
      if (
        typeof response.data === "string" &&
        response.data.match(
          "This page is used to hold your data while you are being authorized for your request."
        )
      ) {
        await this.resumeSession();
	logger.info('resuming session')
        return await this._call(path, method, data, extraHeaders);
      }
      //console.log(response)
      this.collectAuthHeaders(response);
      const newObj = {
        statusMessage: response?.statusText,
        statusCode: response?.status,
        config: response?.config,
        data: response?.data,
        full: response ? response : null,
      };
      return newObj;
    } catch (error) {
      console.log(error)
      const newObj = {
        statusMessage: error?.response?.statusText,
        statusCode: error?.response?.status,
        config: error?.response?.config,
        data: error?.response?.data,
        full: error ? error : null,
      };
      return newObj;
    }
  }

  async firstUse() {
    return await this._call(
      "https://mservice.bankofamerica.com/mgateway/public/v1/appInitialize/BA_ANDROID_HANDSET/22.09.04/firstUse",
      "get"
    );
  }

  async initMobileAuth() {
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/public/initiateMobileAuthentication/v1",
      "post",
      tos,
      {
        channelLOB: "SMRTPH",
        devicePlatform: "Google",
      }
    );
    return response;
  }

  async zelleHistory(o?: any) {
    const { fromDate, toDate } = o || {};
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/transfer-funds-ws/api/transaction/v3/history",
      "post",
      {
        filter: {
          fromDate: fromDate || "2020-01-01",
          statuses: [
            "SCHEDULED",
            "DECLINED",
            "PENDING",
            "PENDING_REVIEW",
            "PROCESSING",
          ],
          toDate: toDate || moment(new Date()).format("YYYY-MM-DD"),
        },
        sortCriteria: {
          fieldName: "Date",
          order: "ASCENDING",
        },
      }
    );
    return response.data;
  }

  async transferDetails() {
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/rest/v7/transfer-details.json",
      "post",
      {
        acctIdentifier: {},
        opCode: "",
      }
    );
    return response;
  }

  async getAlias() {
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/omni/mm/rest/v3/alias/get",
      "post",
      {
        opCode: "AT_GA",
      }
    );
    return response.data;
  }

  async request({ opCode, alias, memotext, name, requestor, amount }) {
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/rest/v5/money-requests/request-money.json",
      "post",
      {
        moneyRequest: {
          memotext,
          requestor: requestor && {
            aliasToken: requestor, //account email
          },
          responder: alias && [
            {
              requestAmount: amount && {
                amount: amount,
              },
              responderInfo: alias && {
                aliasToken: alias,
                aliasTokenType:
                  (alias.match(/^\d+$/) && "PHONE") ||
                  (alias.match("@") && "EMAIL") ||
                  "NAME",
                name: name && {
                  displayName: name,
                },
              },
            },
          ],
          totalRequestAmount: {
            amount: amount,
          },
        },
        opCode: opCode,
      }
    );
    return response.data;
  }
  async accountsOverview() {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/myaccounts-ws/rest/v6/accountsoverview.filter",
        "post",
        {}
      )
    ).data;
  }

  async sendOtp() {
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/authws/rest/sas/ls/secure/v1/sendCode",
      "post",
      Object.assign(this.securedContactPoint, filterRules)
    );
    return response.data;
  }

  async validateOtp({ otp }) {
    const authCode = { authenticationCode: otp };
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/public/v18/signon/OTP/validate",
      "post",
      Object.assign(authCode, filterRules)
    );
    return response.data;
  }
  async zelleInit() {
    const trfDetails = await this.transferDetails();
    const zellehistory = await this.zelleHistory();
    return zellehistory.data;
  }
  async getCards() {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/csb/administer-accounts-ws/omni/card/v8/settings",
        "post",
        {
          metadata: {},
          payload: {
            subSystemId: "GLOBAL_ACCESS",
          },
        }
      )
    ).data;
  }
  async accountNumber() {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/csb/myaccounts-ws/rest/details/v3a/attribute.filter?key=identifier",
        "post",
        {
          secure: {
            accountToken: this.tokenId,
          },
        }
      )
    ).data;
  }
  async recipients({ numInZelleBucket1, opCode }) {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/rest/v4/recipients.json",
        "post",
        {
          numInZelgleBucket1: numInZelleBucket1 || 6,
          opCode: opCode || "AT_GR",
        }
      )
    ).data;
  }

  async transfer({
    opCode,
    duplicateFlag,
    amount,
    displayName,
    adx,
    payeeId,
    nickName,
    payeeAliasToken,
  }) {
    if (!opCode) opCode = "AT_SMT";
    if (!["AT_VMT", "AT_SMT"].includes(opCode)) throw Error("op-code invalid"); // AT_SMT to transfer
    if (nickName) payeeId = (await this.recipients({} as any)).recipients.find((v) => v.nickName === nickName).identifier;
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/rest/v7/money-transfers.json",
        "post",
        {
          displayName,
          opCode,
          duplicateFlag,
          transaction: {
            amount: {
              amount: Number(amount),
            },
            fromAccountIdentifier: {
              adx: adx || this.tokenId,
            },
            payeeId,
            payeeAliasToken,
          },
        }
      )
    ).data;
  }
  async finishLogin({ otp, register }) {
    await this.validateOtp({ otp });
    return await this.registerDevice();
  }
  async start() {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/public/v1/appInitialize/BA_ANDROID_HANDSET/22.09.04/subsequentUse",
        "get"
      )
    ).data;
  }

  async resumeSession() {
    await this.start();
    await this.initMobileAuth();
    return await this.signIn(this._splitCredentials());
  }
  async registerDevice() {
    const auth = { registerDevice: true };
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/authws/rest/sas/ls/v1/recordDevicePreference",
      "post",
      Object.assign(auth, filterRules)
    );
    return response.data;
  }

  async dashboard() {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/v3/mobileDashboard ",
        "post",
        dashboard
      )
    ).data;
  }
  async txHistory({ accountToken, subAccountToken }) {
    const { data } = await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/myaccounts-ws/rest/details/v4/activity.filter",
      "post",
      { secure: { accountToken: accountToken || this.tokenId, subAccountToken } }
    );
    this.nextItemToken = data.metadata.paging.nextItemToken;
    return data;
  }
  async completeTxHistory({ accountToken, subAccountToken }) {
    const nextItemTokenBackup = this.nextItemToken;
    const data = await this.txHistory({
      accountToken,
      subAccountToken,
    });
    let nextItemToken = data.metadata.paging.nextItemToken;
    let transactions = data.payload.transactions;
    while (nextItemToken) {
      const nextItem = await this.next({
        nextItemToken,
        accountToken,
        subAccountToken,
      });
      nextItemToken = nextItem.metadata.paging.nextItemToken;
      transactions = transactions.concat(nextItem.payload);
    }
    this.nextItemToken = nextItemTokenBackup;
    return transactions;
  }
  async cardholders({ accountToken }) {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/myaccounts-ws/rest/details/v3a/cardholders.filter",
        "post",
        {
          metadata: {},
          secure: {
            accountToken,
          },
        }
      )
    ).data;
  }
  async next({ nextItemToken, accountToken, subAccountToken }) {
    const { data } = await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/myaccounts-ws/rest/details/v4/transactions.filter",
      "post",
      {
        metadata: {
          paging: {
            nextItemToken: nextItemToken || this.nextItemToken,
          },
        },
        operation: "",
        secure: {
          accountToken: accountToken || this.tokenId,
          subAccountToken,
        },
      }
    );
    this.nextItemToken = data.metadata.paging.nextItemToken;
    return data;
  }
  async retrieveSignInHistory() {
    return (
      await this._call(
        "https://mservice.bankofamerica.com/mgateway/authws/sc/sm/incoming/v9/rerieveSignInHistory",
        "post",
        { RetrieveSignInHistoryRequest: {} }
      )
    ).data;
  }
  async eligibleArrangements({ accountToken, featureName, filter }) {
    return await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/customer-ws/rest/v2/eligible-arrangements.json",
      "post",
      {
        accountToken: accountToken || this.tokenId,
        featureName,
        filter,
      }
    );
  }
  async activate({ adx, cvv, expirationMonth, expirationYear }) { 
    const token = this.encrypt(Buffer.from(cvv))
    return await this._call(
      "post",
      "https://mservice.bankofamerica.com/mgateway/csb/v1/card/activate",
      {
        VerifyAuthenticationRequest: {
          tokenSets: [
            {
              subType: "ADXId",
              type: "DEBIT_CARD",
              value: {
                text: adx || this.tokenId,
              },
            },
            {
              subType: "CVV",
              type: "DEBIT_CARD",
              value: {
                cipherData: token,
              },
            },
            {
              subType: "ExpirationMonth",
              type: "DEBIT_CARD",
              value: { text: expirationMonth },
            },
            {
              subType: "ExpirationYear",
              type: "DEBIT_CARD",
              value: { text: expirationYear },
            },
          ],
        },
      }
    );
  }
  async createOneTimeToken({ softToken }) {
    return await this._call(
      "https://mservice.bankofamerica.com/mgateway/csb/authws/common/sm/incoming/customerSoftToken/createOneTimeToken",
      {
        CreateSoftTokenRequest: {
          softToken,
        },
      }
    );
  }
  async addRecipient({
    accountNumber,
    adx,
    firstName,
    lastName,
  }) {
    return (await this._call("https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/rest/v2/recipients.json", 'post',
    {  
       opCode: "AT_AR",
        recipient: {
          businessRecipientIndicator: false,
          name: {
           firstName,
           lastName
          },
          accountNumber,
          adx: adx || this.tokenId,
        }
      }
    )).data;
  }
  async viewRecipients() {
    return (await this._call("https://mservice.bankofamerica.com/mgateway/csb/transfers-ws/rest/v1/transfer-eligibilities.json", 'post',
    {
      acctIdentifier: {
      adx: this.tokenId
      },
      opCode: 'AT_TALPTE'
    }
    )).data;   
  }
  _getPublicKey(type) {
    let pubKey;
    if (type == 'card'){
       let gotPk = false;
        const cookies = this.jar.toJSON().cookies;
        for (var i = 0; i < cookies.length; i++){
          if (cookies[i].key == "SMSESSION") {
              pubKey = cookies[i].value;
              gotPk = true;
          } 
        }
      }
    if (type == 'login'){
      pubKey = this.publicKey;
    }       
    return (
      "-----BEGIN PUBLIC KEY-----\n" +
      pubKey+
      "\n-----END PUBLIC KEY-----"
    );
  }
  encrypt({ buffer }) {
    return crypto.publicEncrypt(
      {
        key: this._getPublicKey('card'),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer
    ).toString('base64');
  }
  async signIn({ username, password }) {
    const publicKey = this._getPublicKey('login');
    const uids = username;
    const pwd = password;

    const uencryptedData = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      // We convert the data string to a buffer using `Buffer.from`
      Buffer.from(uids)
    );

    const pencryptedData = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      // We convert the data string to a buffer using `Buffer.from`
      Buffer.from(pwd)
    );

    const data = {
      filterRules: [
        {
          name: "PLATFORM",
          value: "CONSUMER",
        },
        {
          name: "BRAND",
          value: "NBAA",
        },
        {
          name: "CHANNEL",
          value: "MDA",
        },
        {
          name: "FLOW",
          value: "SignInIdPwd",
        },
      ],
      processRules: [
        {
          name: "qvbEnrolled",
          value: "false",
        },
        {
          name: "SAVE_ONLINE_ID",
          value: "false",
        },
      ],
      registrationVerification: {},
      tokenSets: [
        {
          type: "ONLINE_ID",
          value: {
            cipherData: {
              value: uencryptedData.toString("base64"),
            },
          },
        },
        {
          type: "PASSWORD",
          value: {
            cipherData: {
              value: pencryptedData.toString("base64"),
            },
          },
        },
      ],
    };
    this.credentials = username + ":" + password;
    const response = await this._call(
      "https://mservice.bankofamerica.com/mgateway/public/v18/signon",
      "post",
      data,
      {
        channelLOB: "SMRTPH",
        pkiEncryptedData: "RSA2",
        pkienryptedPwd: true,
        SafePassCapable: "SafePassCapable",
        AuthMode: "PC",
        AlertPrefOptOut: false,
        Subchannel: "MBTOLA",
        "device-type": "GOOGLE",
        devicePlatform: "Google",
      }
    );
    return response.data;
  }
}
