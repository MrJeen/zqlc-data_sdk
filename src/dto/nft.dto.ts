import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, Validate, IsOptional } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ContractBaseDto } from './contract.dto';
import { IsEtherAddress } from '../validator/custom.validator';
import { ToLowerCase } from '../decorator/custom.decorator';

@Exclude()
export class NftListDto extends OmitType(ContractBaseDto, ['contract_type']) {
  @IsOptional()
  token_address: string;

  @Expose()
  @ApiPropertyOptional({ description: 'nft id' })
  @IsOptional()
  token_id: string;

  @Expose()
  @ApiPropertyOptional({ description: 'nft name' })
  @IsOptional()
  name: string;

  @Expose()
  @ApiPropertyOptional({ description: '用户地址' })
  @IsOptional()
  @Validate(IsEtherAddress, { message: 'Illegal user address.' })
  @ToLowerCase()
  user_address: string;

  @Expose()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: '每页大小' })
  page_size: number;

  @Expose()
  @ApiPropertyOptional({ description: '分页游标' })
  @IsOptional()
  cursor: string;
}

@Exclude()
export class NftDto extends PickType(ContractBaseDto, [
  'token_address',
  'chain_id',
]) {
  @Expose()
  @ApiPropertyOptional({ description: '合约地址' })
  @IsOptional()
  token_address: string;

  @Expose()
  @ApiPropertyOptional({ description: 'nft id' })
  @IsOptional()
  token_id: string;

  @Expose()
  @ApiPropertyOptional({ description: 'nft name' })
  @IsOptional()
  name: string;
}

@Exclude()
export class NftSyncOwnerDao extends PickType(ContractBaseDto, ['chain_id']) {
  @Expose()
  @ApiPropertyOptional({ description: 'tokenHash' })
  @IsArray()
  @ArrayNotEmpty()
  token_hashes: string[];
}

@Exclude()
export class NftSyncAllDao extends OmitType(ContractBaseDto, [
  'contract_type',
]) {}

@Exclude()
export class NftResultDto extends ContractBaseDto {
  @Expose()
  @ApiProperty({ description: '铸造区块高度' })
  block_number_minted: number;

  @Expose()
  @ApiProperty({ description: 'nft 数量' })
  amount: string;

  @Expose()
  @ApiProperty({ description: 'nft id' })
  token_id: string;

  @Expose()
  @ApiProperty({ description: 'nft name' })
  name: string;

  @Expose()
  @ApiProperty({ description: '元数据' })
  metadata: object;
}

@Exclude()
export class NftListResultDto {
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
  @Type(() => NftResultDto)
  @ApiProperty({
    description: 'nft列表',
    type: NftResultDto,
  })
  data: any[];
}
