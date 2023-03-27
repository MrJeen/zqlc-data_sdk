import OSS from 'ali-oss';
import { md5 } from '../utils/helper';

const clients = new Map();

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
