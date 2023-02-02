import { Transform } from 'class-transformer';
import _ from 'lodash';

// 转为小写字母
export function ToLowerCase() {
  return Transform(({ value }) => (value ? value.toLowerCase() : value));
}

// 转为大写字母
export function ToUpperCase() {
  return Transform(({ value }) => (value ? value.toUpperCase() : value));
}

// 移除字符串两端空格或指定字符
export function Trim(char = ' ') {
  return Transform(({ value }) => (value ? _.trim(value, char) : value));
}

// 复制其他键值
export function Duplicate(key: string) {
  return Transform(({ value, obj }) => value ?? obj[key]);
}
