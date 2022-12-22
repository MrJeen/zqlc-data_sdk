import axios from 'axios';
import { createHmac } from 'crypto';

export const sendMsg = async (webhook: string, secret: string, msg: any) => {
  // moralis - C0006 报错不发送
  if (msg.indexOf('C0006') !== -1) {
    return;
  }

  const timestamp = new Date().getTime();
  const sign = buildSign(timestamp, secret);
  const url = webhook + '&' + 'timestamp=' + timestamp + '&' + 'sign=' + sign;
  const content = {
    msgtype: 'text',
    text: {
      // 限制 20000 bytes以内，这里仅截取 1000 bytes
      content: Buffer.from(msg).subarray(0, 1000).toString(),
    },
  };

  return axios
    .post(url, content)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      throw e;
    });
};

function buildSign(timestamp: number, secret: string) {
  const stringToSign = timestamp + '\n' + secret;
  const hash = createHmac('sha256', secret)
    .update(stringToSign)
    .digest('base64');
  return encodeURI(hash);
}
