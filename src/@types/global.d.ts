import { Express } from 'express';

export {}; // make the file a module, to get rid of the warning

declare global {
    namespace NodeJS {
        interface Global {
            env: any;
            assetPath: string;
            appRoot: string;
            appPath: string;
            app: Express;
        }
    }
}