import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    format: 'uuid',
    example: '9f1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  })
  id: string;

  @ApiProperty({ example: 'Demo User' })
  name: string;

  @ApiProperty({ format: 'email', example: 'demo@example.com' })
  email: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-01T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-01T10:00:00.000Z' })
  updatedAt: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ type: UserProfileDto })
  data: UserProfileDto;
}
