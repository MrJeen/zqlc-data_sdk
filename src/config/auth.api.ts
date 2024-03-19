import dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

// 服务之间签名参数
export const AUTH = {
  // service_id: secret
  [process.env.API_DEFAULT]: process.env.API_DEFAULT_SECRET, // 系统默认
  [process.env.API_OPENMETA]: process.env.API_OPENMETA_SECRET, // openmeta
  [process.env.API_SUDO]: process.env.API_SUDO_SECRET, // sudo
  [process.env.API_OPENMETA_MDEX]: process.env.API_OPENMETA_MDEX_SECRET, // openmeta-mdex
};

export enum CONTRACT_SOURCE {
  DEFAULT = eval(process.env.API_DEFAULT),
  OPEN_META = eval(process.env.API_OPENMETA),
  SUDO = eval(process.env.API_SUDO),
  OPEN_META_MDEX = eval(process.env.API_OPENMETA_MDEX),
}
