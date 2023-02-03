import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEtherAddress } from '../validator/custom.validator';
import { NftResultDto, NftSyncOwnerDao } from './nft.dto';
import { ContractBaseDto, ContractSyncDto } from './contract.dto';

@Exclude()
export class UserNftDto extends NftSyncOwnerDao {
  @Expose()
  @ApiPropertyOptional({ description: '用户地址' })
  @Validate(IsEtherAddress, { message: 'Illegal user address.' })
  user_address: string;
}

@Exclude()
export class UserListDto extends OmitType(ContractSyncDto, ['contract_type']) {
  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ description: 'nft id' })
  token_id: string;

  @Expose()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: '每页大小' })
  page_size: string;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ description: '分页游标' })
  cursor: string;
}

@Exclude()
export class UserResultDao extends ContractBaseDto {
  @Expose()
  @ApiProperty({ description: 'nft 数量' })
  amount: string;

  @Expose()
  @ApiProperty({ description: 'nft id' })
  token_id: string;

  @Expose()
  @ApiProperty({ description: '用户地址' })
  user_address: string;

  @Expose()
  @Type(() => NftResultDto)
  @ApiProperty({ description: 'nft 信息', type: NftResultDto })
  nft_info: any[];
}

@Exclude()
export class UserListResultDto {
  @Expose()
  @ApiProperty({ description: 'nft 总数' })
  total: number;

  @Expose()
  @ApiProperty({ description: '每页大小' })
  size: number;

  @Expose()
  @ApiProperty({ description: '分页游标' })
  cursor: string;

  @Expose()
  @Type(() => UserResultDao)
  @ApiProperty({
    description: '用户列表',
    type: UserResultDao,
  })
  data: any[];
}
