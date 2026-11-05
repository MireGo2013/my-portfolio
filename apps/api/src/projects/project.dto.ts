import { ApiProperty } from '@nestjs/swagger';
import { ProjectKind } from '../generated/prisma/client.js';

export class ProjectDto {
  @ApiProperty({ example: 'paint-online' })
  slug!: string;

  @ApiProperty({ example: 'Paint Online' })
  name!: string;

  @ApiProperty({ enum: ProjectKind, enumName: 'ProjectKind' })
  kind!: ProjectKind;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  stack!: string[];

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  repoUrl!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  liveUrl!: string | null;
}
