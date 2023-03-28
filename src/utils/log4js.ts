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
const errorLogger = Log4js.getLogger('error');

export class Logger {
  static checkLevel() {
    const level = process.env.LOGGER_LEVEL;
    if (level != logger.level) {
      logger.level = level;
    }
    return logger;
  }

  static log(message: Message) {
    this.checkLevel().log(this.getStackTrace(), JSON.stringify(message));
  }

  static debug(message: Message) {
    this.checkLevel().debug(this.getStackTrace(), JSON.stringify(message));
  }

  static info(message: Message) {
    this.checkLevel().info(this.getStackTrace(), JSON.stringify(message));
  }

  static warn(message: Message) {
    this.checkLevel().warn(this.getStackTrace(), JSON.stringify(message));
  }

  static error(message: Message) {
    const msg = JSON.stringify(message);
    const trace = this.getStackTrace();
    errorLogger.error(trace, msg);
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
    errorLogger.fatal(trace, msg);
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
