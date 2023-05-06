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
const logger = Log4js.getLogger('access');
const errorLogger = Log4js.getLogger('error');

export class Logger {
  static log(message: Message) {
    if (message.error) {
      message.error = this.getErrorStack(message.error);
    }

    logger.log(this.getStackTrace(), JSON.stringify(message, null, 2));
  }

  static debug(message: Message) {
    if (message.error) {
      message.error = this.getErrorStack(message.error);
    }

    logger.debug(this.getStackTrace(), JSON.stringify(message, null, 2));
  }

  static info(message: Message) {
    if (message.error) {
      message.error = this.getErrorStack(message.error);
    }

    logger.info(this.getStackTrace(), JSON.stringify(message, null, 2));
  }

  static warn(message: Message) {
    if (message.error) {
      message.error = this.getErrorStack(message.error);
    }

    logger.warn(this.getStackTrace(), JSON.stringify(message, null, 2));
  }

  static error(message: Message) {
    if (message.error) {
      message.error = this.getErrorStack(message.error);
    }

    const trace = this.getStackTrace();
    const msg = JSON.stringify(message, null, 2);
    errorLogger.error(trace, msg);
    // 发送钉钉通知
    sendMsg(
      process.env.DINGDING_ROBOT_WEBHOOK,
      process.env.DINGDING_ROBOT_SECRET,
      trace + msg,
    );
  }

  static fatal(message: Message) {
    if (message.error) {
      message.error = this.getErrorStack(message.error);
    }

    const trace = this.getStackTrace();
    const msg = JSON.stringify(message, null, 2);
    errorLogger.fatal(trace, msg);
    // 发送钉钉通知
    sendMsg(
      process.env.DINGDING_ROBOT_WEBHOOK,
      process.env.DINGDING_ROBOT_SECRET,
      trace + msg,
    );
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

  static getErrorStack(error: any) {
    if (error instanceof Error) {
      const stack = error.stack.split('\n');
      stack.unshift(error.message);
      stack.unshift(error.name);
      return stack;
    }
    return error + '';
  }
}
