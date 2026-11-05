import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({ example: 'Владислав Соболь' })
  fullName!: string;

  @ApiProperty({ example: 'Fullstack Engineer' })
  title!: string;

  @ApiProperty({ example: 'React / TypeScript / Node.js / NestJS' })
  specialization!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ format: 'uri' })
  telegramUrl!: string;

  @ApiProperty({ format: 'uri' })
  githubUrl!: string;
}
