import { Logger } from './log4js';
import _ from 'lodash';

/**
 * 同步owner到ES
 * @param elasticsearchService
 * @param insert
 * @param update
 */
export async function handleUserNftToES(
  elasticsearchService: any,
  insert: any[],
  update: any[],
) {
  const insertBody = formatUserInsert(insert);
  const updateBody = formatUserUpdate(update);
  const body = insertBody.concat(updateBody);
  try {
    if (body.length) {
      await elasticsearchService.bulk({ body });
    }
  } catch (e) {
    Logger.error({
      title: 'handle-user-nft-es',
      data: body,
      error: e + '',
    });
  }
}

/**
 * 同步NFT到ES
 * @param event
 */
export async function handleNftToEs(
  elasticsearchService: any,
  insert: any[],
  update: any[],
) {
  const insertBody = formatNftInsert(insert);
  const updateBody = formatNftUpdate(update);
  const body = insertBody.concat(updateBody);
  try {
    if (body.length) {
      await elasticsearchService.bulk({ body });
    }
  } catch (e) {
    Logger.error({
      title: 'handle-nft-to-es',
      data: body,
      error: e + '',
    });
  }
}

// 插入数据格式化
function formatUserInsert(data: any[]) {
  let insertBody = [];
  if (data.length) {
    insertBody = data.flatMap((user) => [
      {
        index: {
          _index: process.env.ELASTICSEARCH_USER_NFT_INDEX,
          _id: `${user.id}`,
        },
      },
      {
        id: user.id,
        chain: user.chain,
        user_address: user.user_address,
        token_address: user.token_address,
        token_id: user.token_id,
        token_hash: user.token_hash,
        amount: user.amount,
        contract_type: user.contract_type,
        updated_at: user.updated_at,
      },
    ]);
  }
  return insertBody;
}

// 更新数据格式化
function formatUserUpdate(data: any[]) {
  let updateBody = [];
  if (data.length) {
    updateBody = data.flatMap((user) => [
      {
        update: {
          _index: process.env.ELASTICSEARCH_USER_NFT_INDEX,
          _id: `${user.id}`,
        },
      },
      {
        script: {
          lang: 'painless',
          source: 'ctx._source.amount = params.amount',
          params: { amount: user.amount },
        },
      },
    ]);
  }
  return updateBody;
}

function formatNftInsert(data: any[]) {
  let insertBody = [];
  if (data.length) {
    insertBody = data.flatMap((nft) => [
      {
        index: {
          _index: process.env.ELASTICSEARCH_NFT_INDEX,
          _id: `${nft.id}`,
        },
      },
      {
        id: nft.id,
        chain: nft.chain,
        name: nft.name,
        token_address: nft.token_address,
        token_id: nft.token_id,
        token_hash: nft.token_hash,
        block_number_minted: nft.block_number_minted,
        updated_at: nft.updated_at,
        has_metadata: !_.isEmpty(nft.metadata) ? 1 : 0,
        is_destroyed: nft.is_destroyed,
      },
    ]);
  }
  return insertBody;
}

// 格式化更新数据
function formatNftUpdate(data: any[]) {
  let updateBody = [];
  if (data.length) {
    updateBody = data.flatMap((nft) => [
      {
        update: {
          _index: process.env.ELASTICSEARCH_NFT_INDEX,
          _id: `${nft.id}`,
        },
      },
      {
        script: {
          lang: 'painless',
          source:
            'if(params.name != null){ctx._source.name = params.name}if(params.has_metadata != null){ctx._source.has_metadata = params.has_metadata}if(params.is_destroyed != null){ctx._source.is_destroyed = params.is_destroyed}',
          params: {
            ...(nft.hasOwnProperty('name') ? { name: nft.name } : {}),
            ...(nft.hasOwnProperty('metadata')
              ? { has_metadata: !_.isEmpty(nft.metadata) ? 1 : 0 }
              : {}),
            ...(nft.hasOwnProperty('is_destroyed')
              ? { is_destroyed: nft.is_destroyed }
              : {}),
          },
        },
      },
    ]);
  }
  return updateBody;
}
