import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Validate } from 'class-validator';
import { CONTRACT_TYPE } from '../entity/contract.entity';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEtherAddress } from '../validator/custom.validator';
import { ToLowerCase, ToUpperCase } from '../decorator/custom.decorator';
import { NETWORKS } from '../config/constant';

@Exclude()
export class ContractBaseDto {
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
