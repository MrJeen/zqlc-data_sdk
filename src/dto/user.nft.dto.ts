import { ApiPropertyOptional } from '@nestjs/swagger';
import { Validate } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { IsEtherAddress } from '../validator/custom.validator';
import { NftSyncOwnerDao } from './nft.dto';

@Exclude()
export class UserNftDto extends NftSyncOwnerDao {
  @Expose()
  @ApiPropertyOptional({ description: '用户地址' })
  @Validate(IsEtherAddress, { message: 'Illegal user address.' })
  user_address: string;
}
