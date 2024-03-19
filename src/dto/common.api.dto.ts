import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { CONTRACT_SOURCE } from '../config/auth.api';

@Exclude()
export class ServiceRequestDto {
  @Expose()
  @IsEnum(Object.values(CONTRACT_SOURCE), { message: 'Illegal service id.' })
  service_id: number;

  @Expose()
  @IsNotEmpty()
  @IsString()
  nonce_str: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  sign: string;
}

@Exclude()
export class ResponseDto {
  @Expose()
  @ApiProperty({ description: '接口响应状态（0：成功，-1：失败）' })
  code: number;

  @Expose()
  @ApiProperty({ description: '接口响应状态码' })
  statusCode: number;

  @Expose()
  @ApiProperty({ description: '错误描述，当code为-1是返回' })
  message: string;

  @Expose()
  @ApiProperty({ description: '接口响应内容' })
  result: object;
}
