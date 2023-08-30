import { Logger } from './log4js';
import _ from 'lodash';
import { Nft } from '../entity/nft.entity';

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
