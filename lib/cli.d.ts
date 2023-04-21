import { BofAClient } from "./bofa";
import "setimmediate";
export declare function saveSession(bofa: any, json?: boolean, filename?: string): Promise<any>;
export declare function loadSession(): Promise<BofAClient>;
export declare function saveSessionAs(filename: any): Promise<void>;
export declare function initSession(name: string): Promise<void>;
export declare function setSessionName(name: string): Promise<void>;
export declare function getSessionName(): Promise<any>;
export declare function callAPI(command: any, data: any): Promise<any>;
export declare function loadFiles(data: any): Promise<any>;
export declare function loadSessionFrom(name: any): Promise<void>;
export declare function runCLI(): Promise<any>;