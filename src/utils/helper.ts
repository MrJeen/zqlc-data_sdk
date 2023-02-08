import { validate } from 'class-validator';
import _ from 'lodash';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm/error/QueryFailedError';
import { Logger } from './log4js';
import {
  createCipheriv,
  scrypt,
  createDecipheriv,
  Encoding,
  createHash,
} from 'crypto';
import { promisify } from 'util';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ExecutionContext } from '@nestjs/common';
import { BalanceData } from '../config/constant';

/**
 * 等待函数
 * @param milliseconds 毫秒
 */
export function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * md5
 * @param data
 * @returns
 */
export function md5(data: string) {
  return createHash('md5').update(data).digest('hex');
}

/**
 * 签名
 * @param data
 * @param secret
 */
export function buildSignature(data: object, secret: string): string {
  let str = '';
  data = ksort(data);
  _.forEach(data, (value, key) => {
    str += key + '=' + value + '&';
  });
  str += 'secret=' + secret;
  return md5(str);
}

/**
 * 对象按key顺序排序
 * @param data
 */
export function ksort(data: object): object {
  const sorted = {};
  const keys = Object.keys(data);
  keys.sort();
  keys.forEach((key) => {
    sorted[key] = data[key];
  });
  return sorted;
}

/**
 * api响应
 * @param response
 * @param statusCode
 * @param message
 * @param result
 * @param code
 */
export function apiResponse(
  response: Response,
  statusCode: number,
  message: string,
  result: object,
  code = 0,
): void {
  response.status(200).json({
    code,
    statusCode,
    message,
    result,
  });
}

/**
 * 未使用pm2，或者为pm2指定进程
 */
export function isDirectInstance(instance: string): boolean {
  if (process.env.NODE_APP_INSTANCE === undefined) {
    return true;
  }
  return process.env.NODE_APP_INSTANCE === instance;
}

/**
 * 获取监听transfer，block的偏移量
 * 不同节点获取到的transfer数量也许会有限制，免费的eth节点，限制在10000以下
 * @param chain
 */
export function getTransferBlockIncr(chain: string): number {
  // eg: EHT_BLOCK_INCR
  return ~~process.env[chain.toUpperCase() + '_BLOCK_INCR'] || 0;
}

/**
 * 打印sql错误信息
 * @param error
 */
export function queryFailedError(error) {
  if (error instanceof QueryFailedError) {
    Logger.error({
      title: 'sql-query-failed-error',
      data: {
        parameters: error.parameters,
        driverError: error.driverError + ':' + error.driverError.detail,
      },
    });
  }
}

/**
 * 替换字符串中间部分字符
 * @param str
 * @param left
 * @param right
 * @param middle
 */
export function stringCut(str: string, left = 1, right = 1, middle = '......') {
  const startStr = Buffer.from(str).subarray(0, left).toString();
  const endStr = Buffer.from(str)
    .subarray(str.length - right, str.length)
    .toString();
  return startStr + middle + endStr;
}

/**
 * 格式化微服务响应数据（转为驼峰式）
 * @param data
 */
export function formatJsonToHump(data) {
  if (!data) {
    return;
  }
  jsonToHump(data);
}

/**
 * 格式化微服务请求数据（转为下划线）
 * @param data
 */
export function formatJsonToUnderline(data) {
  if (!data) {
    return;
  }
  jsonToUnderline(data);
}

/**
 * JSON对象的key值转换为驼峰式
 * @param obj
 */
function jsonToHump(obj) {
  if (obj instanceof Array) {
    obj.forEach(function (v) {
      jsonToHump(v);
    });
  } else if (obj instanceof Object) {
    Object.keys(obj).forEach(function (key) {
      const newKey = underlineToHump(key);
      if (newKey !== key) {
        obj[newKey] = obj[key];
        delete obj[key];
      }
      jsonToHump(obj[newKey]);
    });
  }
}

/**
 * 字符串下划线转驼峰
 * @param string
 */
function underlineToHump(string) {
  return string.replace(/_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
}

/**
 * JSON对象的key值转换为下划线格式
 * @param obj
 */
function jsonToUnderline(obj) {
  if (obj instanceof Array) {
    obj.forEach(function (v) {
      jsonToUnderline(v);
    });
  } else if (obj instanceof Object) {
    Object.keys(obj).forEach(function (key) {
      const newKey = humpToUnderline(key);
      if (newKey !== key) {
        obj[newKey] = obj[key];
        delete obj[key];
      }
      jsonToUnderline(obj[newKey]);
    });
  }
}

/**
 * 字符串的驼峰格式转下划线格式
 * @param string
 */
function humpToUnderline(string) {
  return string.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 参数校验
 * @param options
 */
export async function manualValidate(options) {
  const errors = await validate(options);
  let msg = '';
  if (errors.length) {
    msg = Object.values(errors[0].constraints)[0];
  }
  return msg;
}

/**
 * 微服务响应格式
 * @param code
 * @param message
 * @param result
 */
export function microResponse(code = 0, message = '', result = {}) {
  return { code, message, result };
}

/**
 * 加密
 * @param textToEncrypt
 * @param password
 * @param salt
 * @param keyLength
 * @param algorithm
 * @param iv
 * @param inputEncoding
 * @param outputEncoding
 */
export async function encrypt(
  textToEncrypt: string,
  password = 'zqlc',
  salt = 'salt',
  keyLength = 16,
  algorithm = 'aes-128-cbc',
  iv = '1237896758391827',
  inputEncoding: Encoding = 'utf-8',
  outputEncoding: Encoding = 'base64url',
) {
  const key = (await promisify(scrypt)(password, salt, keyLength)) as Buffer;
  const cipher = createCipheriv(algorithm, key, iv);
  let content = cipher.update(textToEncrypt, inputEncoding, outputEncoding);
  content += cipher.final(outputEncoding);
  return content;
}

/**
 * 解密
 * @param encryptedText
 * @param password
 * @param salt
 * @param keyLength
 * @param algorithm
 * @param iv
 * @param inputEncoding
 * @param outputEncoding
 */
export async function decrypt(
  encryptedText: string,
  password = 'zqlc',
  salt = 'salt',
  keyLength = 16,
  algorithm = 'aes-128-cbc',
  iv = '1237896758391827',
  inputEncoding: Encoding = 'base64url',
  outputEncoding: Encoding = 'utf-8',
) {
  const key = (await promisify(scrypt)(password, salt, keyLength)) as Buffer;
  const decipher = createDecipheriv(algorithm, key, iv);
  let content = decipher.update(encryptedText, inputEncoding, outputEncoding);
  content += decipher.final(outputEncoding);
  return content;
}

/**
 * 获取分页大小
 * @param pageSize
 */
export function getPageSize(pageSize): number {
  // 过滤page参数
  const size = ~~pageSize || 20;
  // 默认最大100条
  const limit = ~~process.env.PAGE_SIZE || 100;
  return size > limit ? limit : size;
}

/**
 * 响应参数过滤
 * @param context
 * @param data
 */
export function transformResponse(context: ExecutionContext, data) {
  const responseDto = Reflect.getMetadata(
    'swagger/apiResponse',
    context.getHandler(),
  );

  if (responseDto) {
    const responseSuccessDto = _.chain(responseDto)
      .map((value, key) => ({
        ...value,
        status: _.toInteger(key),
      }))
      .filter((responseDto) => responseDto.status < 300)
      .head()
      .value();

    const responseDtoClass = _.get(responseSuccessDto, 'type', null);

    if (responseDtoClass) {
      data = filterData(responseDtoClass, data);
    }
  }

  return data;
}

/**
 * 根据dto配置，筛选需要的数据
 * @param dto
 * @param data
 */
export function filterData(dto, data) {
  return instanceToPlain(
    plainToInstance(dto, data, {
      // 将参数类型转换为dto中设置的类型，再校验（比如get提交的是字符串，转为number）
      enableImplicitConversion: true,
    }),
    {
      // 默认会把dto里面有设置，但未定义的参数也展示；设置为false，过滤undefined的参数
      exposeUnsetFields: false,
    },
  );
}

/**
 * 加权平滑轮询(负载均衡)
 */
export function loadBalance(data: BalanceData[]) {
  let current: any;
  let totalWeught = 0;
  for (let i = 0; i < data.length; i++) {
    totalWeught += data[i].weight;
    if (data[i].currentWeight === undefined) {
      data[i].currentWeight = 0;
    }
    data[i].currentWeight += data[i].weight;
    if (!current) {
      current = data[i];
    } else {
      if (current.currentWeight < data[i].currentWeight) {
        current = data[i];
      }
    }
  }

  // 当前选中权重减去总权重
  current.currentWeight -= totalWeught;

  return current.target;
}

/**
 * 获取token hash
 * @param address
 * @param tokenId
 * @returns
 */
export function getTokenHash(address: string, tokenId: any) {
  return md5(address + tokenId);
}

/**
 * 转数字
 * @param target
 * @returns
 */
export function toNumber(target: any) {
  const result = Number(target);
  return isNaN(result) ? 0 : result;
}
