import { Logger } from './log4js';
import _ from 'lodash';
import { Nft } from '../entity/nft.entity';
import { UserNft } from '../entity/user.nft.entity';

/**
 * 同步owner到ES
 * @param elasticsearchService
 * @param insert
 * @param update
 */
export async function handleUserNftToES(
  elasticsearchService: any,
  users: UserNft[],
) {
  const body = formatUser(users);
  try {
    if (body.length) {
      return await elasticsearchService.bulk({ body });
    }
  } catch (e) {
    Logger.error({
      title: 'handle-user-nft-es',
      data: '',
      error: e,
    });
  }
}

/**
 * 同步NFT到ES
 * @param event
 */
export async function handleNftToEs(elasticsearchService: any, nfts: Nft[]) {
  const body = formatNft(nfts);
  try {
    if (body.length) {
      return await elasticsearchService.bulk({ body });
    }
  } catch (e) {
    Logger.error({
      title: 'handle-nft-to-es',
      data: '',
      error: e,
    });
  }
}

// 更新数据格式化
function formatUser(data: UserNft[]) {
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
        doc: user,
        doc_as_upsert: true,
      },
    ]);
  }
  return updateBody;
}

// 格式化更新数据
function formatNft(data: Nft[]) {
  let updateBody = [];
  if (data.length) {
    updateBody = data.flatMap((nft) => {
      // 避免改变nft本身的值
      const value = { ...nft };
      // 除了metadata不要，其他都存
      value['has_metadata'] = !_.isEmpty(value.metadata) ? 1 : 0;
      delete value.metadata;
      return [
        {
          update: {
            _index: process.env.ELASTICSEARCH_NFT_INDEX,
            _id: `${value.id}`,
          },
        },
        {
          doc: value,
          doc_as_upsert: true,
        },
      ];
    });
  }

  return updateBody;
}
