import path from 'path';
import fs from 'fs';
import process from 'process';
import dayjs from 'dayjs';
import appRoot from 'app-root-path';
import * as stackTraceParser from 'stacktrace-parser';
import * as dotenv from 'dotenv';
import { description, version } from '../package.json';
import { getOsEnv, getOsEnvNumberOptional, getOsEnvOptional, normalizePort } from './lib/env.utils';

const isValidArray = (arr) => {
    return Array.isArray(arr) && arr.length > 0;
}

const terminate = (value = 1) => {
    process.exit(value);
}

const boilerplateLines = (line) => {
    return line && module && line.file.indexOf(module) && line.file.indexOf('/node_modules/') < 0 && line.file.indexOf('node:internal/') < 0;
};

const getCaller = (depth = 2, stack = undefined) => {
    stack = stack || new Error().stack; // change to 3 for grandparent func
    const parsed = stackTraceParser.parse(stack);
    const stacks = parsed.filter(boilerplateLines).filter(line => {
        return line.file.indexOf('/lib/logger.ts') < 0 && line.file.indexOf('<anonymous>') < 0
    });
    const location = isValidArray(stacks) ? stacks[Math.min(depth, stacks.length - 1)] : parsed[1];
    const func = location?.methodName ? location?.methodName : 'invalid';
    const line = location?.lineNumber? location?.lineNumber : 'invalid';
    const file = location?.file ? path.basename(location?.file) : 'invalid';

    return `${file}:${line} (${func})`
}

/**
 * Load .env file or for tests the .env.test file.
 */
const postfix = () => {
    const envs = [ ['prod', ''], ['dev', '.dev']];
    const env = process.env.NODE_ENV?.toLowerCase();

    if (!env) return '';

    const result = '.' + env;
    // return true 는 break
    // return false 는 continue
    // @ts-ignore
    const found = envs.find(e => {
        const key = e[0];
        const match = env.toLowerCase().startsWith(key);
        return match;
    });

    return Array.isArray(found) && found.length > 0 ? found[1] : result;
}

export const getEnv = () => {
    // console.log(dayjs().format(), '[getEnv]', `cache: ${global.env ? 'valid' : 'empty'}`, getCaller());
    if (global.env) return global.env;

    const config = { path: path.join(appRoot.path, `.env${postfix()}`) };

    try {
        if (fs.existsSync(config.path)) {
            //file exists
        } else {
            console.error(dayjs().format(), getCaller(), process.env.NODE_ENV, JSON.stringify(config));
            terminate(1);
        }
    } catch(err) {
        console.error(dayjs().format(), getCaller(), process.env.NODE_ENV, JSON.stringify(config), err);
        terminate(1);
    }

    dotenv.config(config);

    const env = {
        config: config,
        mode: {
            prod: process.env.NODE_ENV?.toLowerCase().includes('prod'),
            dev: process.env.NODE_ENV?.toLowerCase().includes('dev'),
            test: process.env.NODE_ENV?.toLowerCase().includes('test'),
            value: process.env.NODE_ENV?.toLowerCase(),
            // staging 서버의 NODE_ENV는 'PRODUCTION'이다. 혼선 방지용 변수 추가
            stage: process.env.STAGE?.toUpperCase(),
        },
        init: {
        },
        auth: {
            jwt: {
                secret: getOsEnv('SECRET_JWT'),
            },
            secret: getOsEnv('SECRET_KEY'),
        },
        mysql: {
            name:  getOsEnvOptional('MYSQL_NAME', undefined),
            schema: getOsEnvOptional('MYSQL_SCHEMA'),
            port: getOsEnv('MYSQL_PORT'),
            option: {
                timeout: getOsEnvNumberOptional('MYSQL_OPTION_TIMEOUT', 10000),
            },
            write: {
                host: getOsEnv('MYSQL_WRITE_HOST'),
                username: getOsEnv('MYSQL_WRITE_USERNAME'),
                password: getOsEnv('MYSQL_WRITE_PASSWORD'),
            },
            read: {
                host: getOsEnv('MYSQL_READ_HOST'),
                username: getOsEnv('MYSQL_READ_USERNAME'),
                password: getOsEnv('MYSQL_READ_PASSWORD'),
            },
            pool: {
                min: getOsEnvNumberOptional('MYSQL_POOL_MIN', 5),
                max: getOsEnvNumberOptional('MYSQL_POOL_MAX', 20),
                idle: getOsEnvNumberOptional('MYSQL_POOL_IDLE', 10000),
                acquire: getOsEnvNumberOptional('MYSQL_POOL_ACQUIRE', 30000),
                evict: getOsEnvNumberOptional('MYSQL_POOL_EVICT', 10000),
            },
            multi: getOsEnv('MYSQL_WRITE_HOST') !== getOsEnv('MYSQL_READ_HOST'),
        },
        app: {
            name: getOsEnv('APP_NAME'),
            version: version,
            description: description,
            port: normalizePort(process.env.APP_PORT),
            cors: {
                origins: getOsEnvOptional('APP_CORS_ORIGINS') || getOsEnvOptional('APP_WEB_URL')
            },
            sentry: {
                dsn: getOsEnvOptional('APP_SENTRY_DSN'),
            },
            web: {
                url: getOsEnvOptional('APP_WEB_URL'),
            },
            hostname: getOsEnvOptional('APP_HOSTNAME'),
            log: {
            },
            feature: {
            }
        },
        aws: {
        },
        email: {
        },
        policy: {
        },
        search: {
        },
        redis: {
        },
        slack: {}
    }

    return env;
}
