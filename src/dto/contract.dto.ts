import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Validate,
  ValidateIf,
} from 'class-validator';
import { CHAIN, CONTRACT_TYPE } from '../entity/contract.entity';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEtherAddress } from '../validator/custom.validator';
import { ToLowerCase, ToUpperCase } from '../decorator/custom.decorator';

@Exclude()
export class ContractBaseDto {
  @Expose()
  @ApiProperty({
    description: '区块链',
    enum: CHAIN,
  })
  @IsString()
  @IsEnum(CHAIN, { message: 'Illegal chain.' })
  @ToUpperCase()
  chain: string;

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
export class ContractSyncDto extends PickType(ContractBaseDto, [
  'token_address',
  'contract_type',
]) {
  @Expose()
  @Type(() => String)
  @ApiPropertyOptional({
    description: '区块链',
    enum: CHAIN,
  })
  @ValidateIf((item) => !item.chain_id)
  @IsEnum(CHAIN, { message: 'Illegal chain.' })
  @ToUpperCase()
  chain?: string;

  @Expose()
  @Type(() => Number)
  @ValidateIf((item) => !item.chain)
  @ApiPropertyOptional({
    description: '区块链ID',
    enum: CHAIN,
  })
  @IsEnum(CHAIN, { message: 'Illegal chain id.' })
  chain_id?: number;

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
