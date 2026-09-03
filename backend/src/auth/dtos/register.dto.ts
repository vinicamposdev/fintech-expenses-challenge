import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the account owner.',
    example: 'Demo User',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      'Email used to sign in. Must be unique — registering twice with the same email returns 400.',
    format: 'email',
    example: 'demo@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Plain-text password. Stored as a bcrypt hash.',
    example: 'password123',
    minLength: 6,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
