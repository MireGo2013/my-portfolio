import { ApiProperty } from '@nestjs/swagger';

export class SkillCategoryDto {
  @ApiProperty({ example: 'backend' })
  slug!: string;

  @ApiProperty({ example: 'Backend' })
  name!: string;

  @ApiProperty({ type: [String], example: ['Node.js', 'NestJS'] })
  skills!: string[];
}
