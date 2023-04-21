"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCLI = exports.loadSessionFrom = exports.loadFiles = exports.callAPI = exports.getSessionName = exports.setSessionName = exports.initSession = exports.saveSessionAs = exports.loadSession = exports.saveSession = void 0;
const bofa_1 = require("./bofa");
const yargs_1 = __importDefault(require("yargs"));
const change_case_1 = require("change-case");
const fs_extra_1 = __importDefault(require("fs-extra"));
require("setimmediate");
const mkdirp_1 = __importDefault(require("mkdirp"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const logger = (0, logger_1.getLogger)();
async function saveSession(bofa, json = false, filename = "") {
    if (!filename)
        filename = (await getSessionName()) + ".json";
    await (0, mkdirp_1.default)(path_1.default.join(process.env.HOME, ".bofa"));
    await fs_extra_1.default.writeFile(path_1.default.join(process.env.HOME, ".bofa", filename), bofa.toJSON());
    if (!json)
        logger.info("saved to ~/" + path_1.default.join(".bofa", filename));
    return bofa;
}
exports.saveSession = saveSession;
async function loadSession() {
    const name = await getSessionName();
    return bofa_1.BofAClient.fromJSON(await fs_extra_1.default.readFile(path_1.default.join(process.env.HOME, ".bofa", name + ".json")));
}
exports.loadSession = loadSession;
async function saveSessionAs(filename) {
    const boa = await loadSession();
    await saveSession(boa, false, filename + ".json");
}
exports.saveSessionAs = saveSessionAs;
//run if app is first time use
async function initSession(name) {
    let boa = bofa_1.BofAClient.initialize({});
    logger.info("generated device");
    logger.info({ deviceId: boa.deviceId, deviceInfo: boa.deviceInfo });
    const first = await boa.firstUse();
    const init = await boa.initMobileAuth();
    await setSessionName(name);
    await saveSession(boa);
}
exports.initSession = initSession;
async function setSessionName(name) {
    await fs_extra_1.default.writeFile(path_1.default.join(process.env.HOME, ".bofa", "session"), name);
}
exports.setSessionName = setSessionName;
async function getSessionName() {
    try {
        return (await fs_extra_1.default.readFile(path_1.default.join(process.env.HOME, ".bofa", "session"), "utf8")).trim();
    }
    catch (e) {
        await setSessionName("session");
        return "session";
    }
}
exports.getSessionName = getSessionName;
async function callAPI(command, data) {
    const boa = await loadSession();
    const camelCommand = (0, change_case_1.camelCase)(command);
    const json = data.j || data.json;
    if (json)
        logger.info = function (v) { };
    delete data.j;
    delete data.json;
    if (!boa[camelCommand])
        throw Error("command not foud: " + command);
    const result = await boa[camelCommand](data);
    if (json)
        console.log(JSON.stringify(result, null, 2));
    else
        logger.info(result);
    await saveSession(boa, json);
    return result;
}
exports.callAPI = callAPI;
async function loadFiles(data) {
    const fields = [];
    for (let [k, v] of Object.entries(data)) {
        const parts = /(^.*)FromFile$/.exec(k);
        if (parts) {
            const key = parts[1];
            fields.push([key, await fs_extra_1.default.readFile(v)]);
        }
        else {
            fields.push([k, v]);
        }
    }
    return fields.reduce((r, [k, v]) => {
        r[k] = v;
        return r;
    }, {});
}
exports.loadFiles = loadFiles;
async function loadSessionFrom(name) {
    await setSessionName(name);
    const boa = bofa_1.BofAClient.fromObject(require(path_1.default.join(process.env.HOME, ".bofa", name)));
    await saveSession(boa);
}
exports.loadSessionFrom = loadSessionFrom;
async function runCLI() {
    const [command] = yargs_1.default.argv._;
    const options = Object.assign({}, yargs_1.default.argv);
    delete options._;
    const data = await loadFiles(Object.entries(options).reduce((r, [k, v]) => {
        r[(0, change_case_1.camelCase)(k)] = String(v);
        return r;
    }, {}));
    switch (command) {
        case "init":
            return await initSession(yargs_1.default.argv._[1]);
            break;
        case "save":
            return await saveSessionAs(yargs_1.default.argv._[1]);
            break;
        case "load":
            return await loadSessionFrom(yargs_1.default.argv._[1]);
            break;
        default:
            return await callAPI(yargs_1.default.argv._[0], data);
            break;
    }
}
exports.runCLI = runCLI;
//# sourceMappingURL=cli.js.map