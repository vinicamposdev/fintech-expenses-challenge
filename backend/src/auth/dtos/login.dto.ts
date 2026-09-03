import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email of a registered user.',
    format: 'email',
    example: 'demo@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password used at registration.',
    example: 'password123',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
