import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({ example: 'Владислав Соболь' })
  fullName!: string;

  @ApiProperty({ example: 'Fullstack Engineer' })
  title!: string;

  @ApiProperty({ example: 'React / TypeScript / Node.js / NestJS' })
  specialization!: string;

  @ApiProperty({ example: 'Влад', description: 'Имя для приветствия' })
  shortName!: string;

  @ApiProperty({ description: 'Короткое описание для поисковиков' })
  summary!: string;

  @ApiProperty({ type: [String], description: 'История о себе, по абзацам' })
  about!: string[];

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ format: 'uri' })
  telegramUrl!: string;

  @ApiProperty({ format: 'uri' })
  githubUrl!: string;

  @ApiProperty({ format: 'uri' })
  linkedinUrl!: string;
}
