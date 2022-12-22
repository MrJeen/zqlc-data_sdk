import path from 'path';
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
      //日志文件按日期切割
      pattern: 'yyyyMMdd',
      numBackups: 120,
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
      numBackups: 120,
      keepFileExt: true,
    },
  },
  categories: {
    default: {
      appenders: ['console', 'access'],
      level: 'warn',
    },
    error: {
      appenders: ['console', 'error'],
      level: 'warn',
    },
  },
  // 使用pm2来管理项目时打开
  pm2: true,
  // 会根据 pm2 分配的 id 进行区分，以免各进程在写日志时造成冲突
  // pm2InstanceVar: 'INSTANCE_ID',
  disableClustering: true,
};
export default log4jsConfig;
