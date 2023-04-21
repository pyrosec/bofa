import { BofAClient } from "./bofa";
import yargs from "yargs";
import { camelCase } from "change-case";
import fs from "fs-extra";
import util from "util";
import "setimmediate";
import mkdirp from "mkdirp";
import path from "path";
import { getLogger } from "./logger";
import { Console } from "console";

const logger = getLogger();

export async function saveSession(bofa, json = false, filename = "") {
  if (!filename) filename = (await getSessionName()) + ".json";
  await mkdirp(path.join(process.env.HOME, ".bofa"));
  await fs.writeFile(
    path.join(process.env.HOME, ".bofa", filename),
    bofa.toJSON()
  );
  if (!json) logger.info("saved to ~/" + path.join(".bofa", filename));
  return bofa;
}

export async function loadSession() {
  const name = await getSessionName();
  return BofAClient.fromJSON(
    await fs.readFile(path.join(process.env.HOME, ".bofa", name + ".json"))
  );
}

export async function saveSessionAs(filename) {
  const boa = await loadSession();
  await saveSession(boa, false, filename + ".json");
}

//run if app is first time use
export async function initSession(name: string) {
  let boa = BofAClient.initialize({});
  logger.info("generated device");
  logger.info({ deviceId: boa.deviceId, deviceInfo: boa.deviceInfo });
  const first = await boa.firstUse();
  const init = await boa.initMobileAuth();
  await setSessionName(name);
  await saveSession(boa);
}

export async function setSessionName(name: string) {
  await fs.writeFile(path.join(process.env.HOME, ".bofa", "session"), name);
}

export async function getSessionName() {
  try {
    return (
      await fs.readFile(path.join(process.env.HOME, ".bofa", "session"), "utf8")
    ).trim();
  } catch (e) {
    await setSessionName("session");
    return "session";
  }
}

export async function callAPI(command, data) {
  const boa = await loadSession();
  const camelCommand = camelCase(command);
  const json = data.j || data.json;
  if (json) logger.info = (function (v) {} as any);
  delete data.j;
  delete data.json;
  if (!boa[camelCommand]) throw Error("command not foud: " + command);
  const result = await boa[camelCommand](data);
  if (json) console.log(JSON.stringify(result, null, 2));
  else logger.info(result);
  await saveSession(boa, json);
  return result;
}

export async function loadFiles(data: any) {
  const fields = [];
  for (let [k, v] of Object.entries(data)) {
    const parts = /(^.*)FromFile$/.exec(k);
    if (parts) {
      const key = parts[1];
      fields.push([key, await fs.readFile(v)]);
    } else {
      fields.push([k, v]);
    }
  }
  return fields.reduce((r, [k, v]) => {
    r[k] = v;
    return r;
  }, {});
}

export async function loadSessionFrom(name) {
  await setSessionName(name);
  const boa = BofAClient.fromObject(
    require(path.join(process.env.HOME, ".bofa", name))
  );
  await saveSession(boa);
}

export async function runCLI() {
  const [command] = yargs.argv._;
  const options = Object.assign({}, yargs.argv);
  delete options._;
  const data = await loadFiles(
    Object.entries(options).reduce((r, [k, v]) => {
      r[camelCase(k)] = String(v);
      return r;
    }, {})
  );
  switch (command) {
    case "init":
      return await initSession(yargs.argv._[1]);
      break;
    case "save":
      return await saveSessionAs(yargs.argv._[1]);
      break;
    case "load":
      return await loadSessionFrom(yargs.argv._[1]);
      break;
    default:
      return await callAPI(yargs.argv._[0], data);
      break;
  }
}
