import express from 'express';
import logger from './lib/logger';
import * as mysql from './lib/mysql';
import { build, version } from '../package.json';
import * as process from 'process';
import { isMasterProcess } from 'pm2-master-process';
import os from 'os';
import { finalizeSentry, initSentry } from './ext/app.sentry';
import { initExpress } from './ext/app.express';
import { handleSentry } from './lib/utils';
import { initGlobals } from './common/globals';

(() => {
    if (!global.env) initGlobals();
})();

const env = global.env;

export const app = express();
export const appPath = __dirname;
export let webSocketServer: any;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// initialize before launching app
const initApp = async () => {
    logger.init({
        log: true,
        sql: true,
        net: true,
        debug: true,
        error: true,
        fatal: true,
        console: false,
    });

    initSentry();
    initExpress();
    finalizeSentry();
}

(async () => {
    try {
        await initApp();

        const pmId = process.env.NODE_APP_INSTANCE || process.env.pm_id || '0';
        const isMaster = await isMasterProcess();
        const worker = isMaster ? 'master' : 'worker';
        const isSuccess = await mysql.connect() ? 'ok' : 'failed';

        app.listen(env.app.port, () => {
            logger.debug(`[${pmId}:${worker}] ----------------------------------------------------------------------------`);
            logger.debug(`[${pmId}:${worker}] 🚀 App listening on the port ${env.app.port} at ${os.hostname()}`);
            logger.debug(`[${pmId}:${worker}]    Initialize result: ${isSuccess}`);
            logger.debug(`[${pmId}:${worker}] ============================================================================`);

            console.log(`${new Date().toISOString()} [${pmId}:${worker}][ v${build || version}, ${env.mode.value}, ${env.mysql.schema}, ${isSuccess} ] =================================== READY !!!`);
        });
    } catch (e) {
        logger.error(e);
        handleSentry('fata', e)
    }
})();