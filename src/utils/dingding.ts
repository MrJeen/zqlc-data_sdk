import axios from 'axios';
import { createHmac } from 'crypto';

export const sendMsg = async (webhook: string, secret: string, msg: any) => {
  const timestamp = new Date().getTime();
  const sign = buildSign(timestamp, secret);
  const url = webhook + '&' + 'timestamp=' + timestamp + '&' + 'sign=' + sign;
  const buffer = Buffer.from(msg);
  const content = {
    msgtype: 'text',
    text: {
      // 限制 20000 bytes以内，这里仅截取 1000 bytes
      content:
        buffer.length > 2018
          ? Buffer.from(msg).subarray(0, 1000).toString() +
            '---分割---' +
            Buffer.from(msg)
              .subarray(buffer.length - 1000, buffer.length)
              .toString()
          : msg,
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
