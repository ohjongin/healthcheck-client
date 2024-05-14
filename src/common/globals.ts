import path from 'path';
import appRootPath from 'app-root-path';
import { getEnv } from '../env';
import { appPath } from '../app.path';

export const initGlobals = () => {
    global.appRoot = appRootPath.path;
    global.appPath = appPath;
    global.assetPath = path.join(appPath, 'assets');
    global.env = getEnv();
    
    // console.log(dayjs().format(), getCaller(), 'appRootPath', appRootPath.path);
    // console.log(dayjs().format(), getCaller(), 'global.appPath', global.appPath);
    // console.log(dayjs().format(), getCaller(), 'global.assetPath', global.assetPath);
};

