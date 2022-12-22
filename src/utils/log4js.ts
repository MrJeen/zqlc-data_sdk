import Path from 'path';
import Log4js from 'log4js';
import Util from 'util';
import Moment from 'moment';
import StackTrace from 'stacktrace-js';
import Chalk from 'chalk';
import config from '../config/log4js';
import { sendMsg } from './dingding';

//日志级别
export enum LoggerLevel {
  ALL = 'ALL',
  MARK = 'MARK',
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
  OFF = 'OFF',
}

export interface Message {
  title: string;
  data: any;
  error?: any;
}

// 内容跟踪类
export class ContextTrace {
  constructor(
    public readonly context: string,
    public readonly path?: string,
    public readonly lineNumber?: number,
    public readonly columnNumber?: number,
  ) {}
}

// 添加自定义布局，需要在 log4js.configure() 之前调用
Log4js.addLayout('Awesome-nest', (logConfig: any) => {
  return (logEvent: Log4js.LoggingEvent): string => {
    let moduleName = '';
    let position = '';

    //日志组装
    const messageList: string[] = [];
    logEvent.data.forEach((value: any) => {
      if (value instanceof ContextTrace) {
        moduleName = value.context;
        //显示触发日志的坐标（行/列）
        if (value.lineNumber && value.columnNumber) {
          position = `${value.lineNumber},${value.columnNumber}`;
        }
        return;
      }
      if (typeof value !== 'string') {
        value = Util.inspect(value, false, 3, true);
      }
      messageList.push(value);
    });
    //日志组成部分
    const messageOutput: string = messageList.join(' ');
    const positionOutput: string = position ? `[${position}]` : '';
    const typeOutput = `[${logConfig.type}]${logEvent.pid.toString()} - `;
    const dateOutput = `${Moment(logEvent.startTime).format(
      'YYYY-MM-DD HH:mm:ss',
    )}`;
    const moduleOutput: string = moduleName
      ? `[${moduleName}]`
      : '[LoggerService]';
    let levelOutput = `[${logEvent.level}]${messageOutput}`;
    //根据日志级别，用不同颜色区分
    switch (logEvent.level.toString()) {
      case LoggerLevel.DEBUG:
        levelOutput = Chalk.green(levelOutput);
        break;

      case LoggerLevel.INFO:
        levelOutput = Chalk.cyan(levelOutput);
        break;

      case LoggerLevel.WARN:
        levelOutput = Chalk.yellow(levelOutput);
        break;

      case LoggerLevel.ERROR:
        levelOutput = Chalk.red(levelOutput);
        break;

      case LoggerLevel.FATAL:
        levelOutput = Chalk.hex('#DD4C35')(levelOutput);
        break;

      default:
        levelOutput = Chalk.grey(levelOutput);
        break;
    }
    return `${levelOutput} ${positionOutput} ${Chalk.green(
      typeOutput,
    )} ${dateOutput} ${Chalk.yellow(moduleOutput)}`;
  };
});

// 注入配置
Log4js.configure(config);
const logger = Log4js.getLogger();
const errorLogger = Log4js.getLogger('error');

export class Logger {
  static checkLevel() {
    const level = process.env.LOGGER_LEVEL;
    if (level) {
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
