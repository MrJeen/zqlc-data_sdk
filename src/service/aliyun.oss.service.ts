import OSS from 'ali-oss';
import { md5 } from '../utils/helper';

const clients = new Map();

/**
 * 获取 buckent: om-base64 客户端
 * @returns
 */
export function getOssOmBase64Client() {
  return getOssClient({
    // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
    region: process.env.OSS_REGION,
    // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
    accessKeyId: process.env.OSS_ACCESS_KEY,
    accessKeySecret: process.env.OSS_ACCESS_SECRET,
    bucket: process.env.OSS_BUCKET,
  });
}

/**
 * 获取oss客户端
 */
export function getOssClient(options: {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket?: string;
}) {
  const key = md5(JSON.stringify(options));
  if (!clients.has(key)) {
    const client = new OSS(options);
    clients.set(key, client);
  }
  return clients.get(key);
}
