import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers/src.ts/json-rpc-provider';
import { Interface } from '@ethersproject/abi/src.ts/interface';
import { CONTRACT_TYPE } from '../entity/contract.entity';
import { contractAbi } from '../config/abi';
import { loadBalance } from './helper';
import { RPC_NODE } from '../config/constant';

/**
 * 获取节点
 * @param chain
 */
export const getNode = (chainId: number): string => {
  return loadBalance(RPC_NODE[chainId]);
};

/**
 * 获取provider
 * @param chain
 */
export const getJsonRpcProvider = (chainId: number): JsonRpcProvider => {
  const node = getNode(chainId);
  return new ethers.providers.JsonRpcProvider(node);
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
export async function getContractInfo(chainId: number, address: string) {
  const rpcUrl = getNode(chainId);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, contractAbi, provider);
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
export async function getContractCreator(contract) {
  try {
    const creator = await contract.owner();
    if (creator) {
      return creator.toLowerCase();
    }
  } catch (e) {}
  return ZERO_ADDRESS;
}

// 获取合约名称
export async function getContractName(contract) {
  try {
    return await contract.name();
  } catch (e) {}
  return '';
}

// 获取代币标识
export async function getContractSymbol(contract) {
  try {
    return await contract.symbol();
  } catch (e) {}
  return '';
}

// 获取合约类型
export async function getContractType(contract) {
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
