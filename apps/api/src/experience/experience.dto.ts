import { ApiProperty } from '@nestjs/swagger';

export class ExperienceDto {
  @ApiProperty({ example: 'scooter-admin-crm' })
  slug!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null, если проект указан без компании',
    example: 'Sparkit / BE Happy',
  })
  company!: string | null;

  @ApiProperty({ example: 'Scooter Admin CRM' })
  project!: string;

  @ApiProperty({ example: 'Lead Frontend Engineer' })
  role!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ example: '2025-08', description: 'Месяц начала, YYYY-MM' })
  startDate!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2025-11',
    description: 'Месяц окончания, YYYY-MM. null, если работа продолжается',
  })
  endDate!: string | null;

  @ApiProperty({ type: [String] })
  responsibilities!: string[];

  @ApiProperty({ type: [String] })
  achievements!: string[];

  @ApiProperty({ type: [String] })
  stack!: string[];
}
