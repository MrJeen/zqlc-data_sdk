import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Validate } from 'class-validator';
import { CHAIN, CONTRACT_TYPE } from '../entity/contract.entity';
import { Exclude, Expose } from 'class-transformer';
import { IsEtherAddress } from '../validator/custom.validator';

@Exclude()
export class ContractBaseDto {
  @Expose()
  @ApiProperty({
    description: '区块链，目前仅支持ETH和BSC',
    enum: Object.keys(CHAIN),
  })
  @IsString()
  @IsEnum(Object.keys(CHAIN), { message: 'Illegal chain.' })
  chain: string;

  @Expose()
  @ApiProperty({ description: '合约地址' })
  @IsString()
  @Validate(IsEtherAddress, { message: 'Illegal token address.' })
  token_address: string;

  @Expose()
  @ApiPropertyOptional({
    description: '合约类型，目前仅支持ERC721和ERC1155',
    enum: Object.values(CONTRACT_TYPE),
  })
  @IsOptional()
  @IsString()
  @IsEnum(Object.values(CONTRACT_TYPE), { message: 'Illegal contract type.' })
  contract_type: string;
}

@Exclude()
export class ContractSyncDto extends ContractBaseDto {}

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
