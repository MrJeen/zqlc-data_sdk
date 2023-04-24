import Path from 'path';
import Log4js from 'log4js';
import StackTrace from 'stacktrace-js';
import config from '../config/log4js';
import { sendMsg } from './dingding';

export interface Message {
  title: string;
  data: any;
  error?: any;
}

// 注入配置
Log4js.configure(config);
const logger = Log4js.getLogger();

export class Logger {
  static log(message: Message) {
    logger.log(this.getStackTrace(), JSON.stringify(message));
  }

  static debug(message: Message) {
    logger.debug(this.getStackTrace(), JSON.stringify(message));
  }

  static info(message: Message) {
    logger.info(this.getStackTrace(), JSON.stringify(message));
  }

  static warn(message: Message) {
    logger.warn(this.getStackTrace(), JSON.stringify(message));
  }

  static error(message: Message) {
    const msg = JSON.stringify(message);
    const trace = this.getStackTrace();
    logger.error(trace, msg);
    // 发送钉钉通知
    sendMsg(
      process.env.DINGDING_ROBOT_WEBHOOK,
      process.env.DINGDING_ROBOT_SECRET,
      trace + msg,
    ).then();
  }

  static fatal(message: Message) {
    const msg = JSON.stringify(message);
    const trace = this.getStackTrace();
    logger.fatal(trace, msg);
    // 发送钉钉通知
    sendMsg(
      process.env.DINGDING_ROBOT_WEBHOOK,
      process.env.DINGDING_ROBOT_SECRET,
      trace + msg,
    ).then();
  }

  // 日志追踪，可以追溯到哪个文件、第几行第几列
  static getStackTrace(deep = 2): string {
    const stackList: StackTrace.StackFrame[] = StackTrace.getSync();
    const stackInfo: StackTrace.StackFrame = stackList[deep];

    const lineNumber: number = stackInfo.lineNumber;
    const columnNumber: number = stackInfo.columnNumber;
    const fileName: string = stackInfo.fileName;
    const basename: string = Path.basename(fileName);
    const functionName: string = stackInfo.functionName;
    const appName = process.env.APP_NAME ?? 'unknown_app_name';
    const env = process.env.APP_ENV;
    return `${appName}:${env}:${basename}:${functionName}(line: ${lineNumber}, column: ${columnNumber}):`;
  }
}
