import path from 'path';
import dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

// 配置日志写入的目录
const baseLogPath = path.resolve('./logs');

const log4jsConfig = {
  appenders: {
    console: {
      //打印到控制台
      type: 'console',
    },
    access: {
      type: 'dateFile',
      filename: `${baseLogPath}/access.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern:
          '{"date":"%d{yyyy-MM-dd hh:mm:ss.SSS}","level":"%p","category":"%c","host":"%h","pid":"%z","data":\'%m\'}',
      },
      // 日志文件按日期切割
      pattern: 'yyyyMMdd',
      // 每个日志文件最大300M
      maxLogSize: 314572800,
      // 最多保留10个文件
      numBackups: 10,
      // 开启日志压缩
      compress: true,
      keepFileExt: true,
    },
    error: {
      type: 'dateFile',
      filename: `${baseLogPath}/error.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern:
          '{"date":"%d{yyyy-MM-dd hh:mm:ss.SSS}","level":"%p","category":"%c","host":"%h","pid":"%z","data":\'%m\'}',
      },
      //日志文件按日期切割
      pattern: 'yyyyMMdd',
      // 每个日志文件最大300M
      maxLogSize: 314572800,
      // 最多保留10个文件
      numBackups: 10,
      // 开启日志压缩
      compress: true,
      keepFileExt: true,
    },
  },
  categories: {
    default: {
      appenders: ['console', 'access'],
      level: process.env.LOGGER_LEVEL || 'debug',
    },
    error: {
      appenders: ['console', 'error'],
      level: process.env.LOGGER_ERROR_LEVEL || 'error',
    },
  },
  // 使用pm2来管理项目时打开
  pm2: true,
  // 会根据 pm2 分配的 id 进行区分，以免各进程在写日志时造成冲突
  // pm2InstanceVar: 'INSTANCE_ID',
  disableClustering: true,
};
export default log4jsConfig;
