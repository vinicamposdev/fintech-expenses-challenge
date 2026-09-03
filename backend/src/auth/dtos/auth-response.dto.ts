import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    format: 'uuid',
    example: '9f1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  })
  id: string;

  @ApiProperty({ example: 'Demo User' })
  name: string;

  @ApiProperty({ format: 'email', example: 'demo@example.com' })
  email: string;
}

export class AuthPayloadDto {
  @ApiProperty({
    description:
      'JWT valid for 24h. Send it as `Authorization: Bearer <token>` on every protected endpoint.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjFiMmMzZC00ZTVmLTZhN2ItOGM5ZC0wZTFmMmEzYjRjNWQiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3NTUwMDAwMDAsImV4cCI6MTc1NTA4NjQwMH0.9dQ0mS3kx1Yw5gk1x8m7fN6b2S0pWq0v3tHkzq7Yc1A',
  })
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

/**
 * Every successful response is wrapped in a `data` envelope by
 * TransformResponseInterceptor.
 */
export class AuthResponseDto {
  @ApiProperty({ type: AuthPayloadDto })
  data: AuthPayloadDto;
}
