import OSS from 'ali-oss';
import dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

// 阿里云oss-base64-metadata存储客户端
export const OSS_OM_BASE64_CLIENT = new OSS({
  // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: process.env.OSS_REGION,
  // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
  accessKeyId: process.env.OSS_ACCESS_KEY,
  accessKeySecret: process.env.OSS_ACCESS_SECRET,
  bucket: process.env.OSS_BUCKET,
  timeout: process.env.OSS_TIMEOUT,
});
