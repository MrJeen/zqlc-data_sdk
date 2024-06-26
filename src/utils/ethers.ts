import { Contract, ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers/src.ts/json-rpc-provider';
import { Interface } from '@ethersproject/abi/src.ts/interface';
import { CONTRACT_TYPE } from '../entity/contract.entity';
import axios from 'axios';

/**
 * 获取节点
 * @param chain
 */
export const getNode = async (chainId: number): Promise<string> => {
  // 调接口取
  const response = await axios({
    url: process.env.API_HOST + '/api/node?chain_id=' + chainId,
    method: 'get',
    headers: {
      is_debug: 1,
    },
  });
  const node = response?.data?.result;
  if (!node) {
    throw Error(`node #${chainId} not found`);
  }
  return node;
};

/**
 * 获取provider
 * @param chain
 * @param timeout 单位秒
 */
export const getJsonRpcProvider = async (
  chainId: number,
  timeout = 30, // 默认30秒超时
): Promise<JsonRpcProvider> => {
  const node = await getNode(chainId);
  let provider = undefined;
  if (timeout === -1) {
    provider = new ethers.providers.JsonRpcProvider(node);
  } else {
    provider = new ethers.providers.JsonRpcProvider({
      url: node,
      timeout: timeout * 1000,
    });
  }
  provider['node'] = node;
  return provider;
};

/**
 * 获取Interface实例
 * @param abi
 */
export const getInterface = (abi: any): Interface => {
  return new ethers.utils.Interface(abi);
};

/**
 * 获取合约实例
 * @param address
 * @param abi
 * @param provider
 */
export const getContract = (
  address: string,
  abi: any,
  provider: JsonRpcProvider,
) => {
  return new ethers.Contract(address, abi, provider);
};

/**
 * 0地址
 */
export const ZERO_ADDRESS = ethers.constants.AddressZero;

// 获取合约信息
export async function getContractInfo(contract: Contract) {
  const creator = await getContractCreator(contract);
  const name = await getContractName(contract);
  const symbol = await getContractSymbol(contract);
  const type = await getContractType(contract);
  return {
    creator,
    name,
    symbol,
    type,
  };
}

// 获取合约创建者
export async function getContractCreator(contract: Contract) {
  try {
    const creator = await contract.owner();
    if (creator) {
      return creator.toLowerCase();
    }
  } catch (e) {}
  return ZERO_ADDRESS;
}

// 获取合约名称
export async function getContractName(contract: Contract) {
  try {
    return await contract.name();
  } catch (e) {}
  return '';
}

// 获取代币标识
export async function getContractSymbol(contract: Contract) {
  try {
    return await contract.symbol();
  } catch (e) {}
  return '';
}

// 获取合约类型
export async function getContractType(contract: Contract) {
  try {
    if (await contract.supportsInterface(0xd9b67a26)) {
      // 1155
      return CONTRACT_TYPE.ERC1155;
    } else if (await contract.supportsInterface(0x80ac58cd)) {
      // 721
      return CONTRACT_TYPE.ERC721;
    }
  } catch (e) {}
  return '';
}

// 每个ethers方法报错都需要特殊处理
export async function ethersCall<T, U>(
  callback: (...args: T[]) => U,
): Promise<U> {
  try {
    return callback();
  } catch (error) {
    // 分析错误信息，错误次数累加
    throw error;
  }
}
