import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Validate,
  ValidateIf,
} from 'class-validator';
import { CONTRACT_TYPE } from '../entity/contract.entity';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEtherAddress } from '../validator/custom.validator';
import { ToLowerCase, ToUpperCase } from '../decorator/custom.decorator';
import { NETWORKS } from '../config/constant';

@Exclude()
export class ContractBaseDto {
  @Expose()
  @ApiProperty({
    description: '区块链',
    enum: NETWORKS.map((item) => item.name),
  })
  @IsString()
  @IsEnum(NETWORKS.map((item) => item.name), { message: 'Illegal chain.' })
  @ToUpperCase()
  chain: string;

  @Expose()
  @Type(() => Number)
  @ApiProperty({
    description: '区块链ID',
    enum: NETWORKS.map((item) => item.chainId),
  })
  @IsEnum(NETWORKS.map((item) => item.chainId), {
    message: 'Illegal chain id.',
  })
  chain_id: number;

  @Expose()
  @ApiProperty({ description: '合约地址' })
  @IsString()
  @Validate(IsEtherAddress, { message: 'Illegal token address.' })
  @ToLowerCase()
  token_address: string;

  @Expose()
  @ApiPropertyOptional({
    description: '合约类型，目前仅支持ERC721和ERC1155',
    enum: Object.values(CONTRACT_TYPE),
  })
  @IsOptional()
  @IsString()
  @IsEnum(Object.values(CONTRACT_TYPE), { message: 'Illegal contract type.' })
  @ToUpperCase()
  contract_type: string;
}

@Exclude()
export class ContractSyncDto extends ContractBaseDto {
  @ValidateIf((item) => !item.chain_id)
  chain: string;

  @ValidateIf((item) => !item.chain)
  chain_id: number;

  @Expose()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({
    description: '是否自动推送',
    enum: [0, 1],
  })
  @IsEnum([0, 1], { message: 'Illegal auto.' })
  auto?: number;
}

@Exclude()
export class ContractResultDto extends PickType(ContractBaseDto, [
  'chain',
  'token_address',
  'contract_type',
]) {
  @Expose()
  @ApiProperty({ description: '合约创建者' })
  creator: string;

  @Expose()
  @ApiProperty({ description: '合约名称' })
  name: string;

  @Expose()
  @ApiProperty({ description: '代币标识' })
  symbol: string;
}
