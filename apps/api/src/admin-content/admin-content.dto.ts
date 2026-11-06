import { ApiProperty } from '@nestjs/swagger';
import { PROJECT_KINDS } from '@portfolio/shared';

// Контракт для OpenAPI. Проверку выполняют Zod-схемы из @portfolio/shared.
// Одни и те же классы описывают и тело запроса, и ответ: админка получает
// запись в том же виде, в каком отправляет её обратно.

// ---------- Профиль ----------

export class ProfileTextDto {
  @ApiProperty() fullName!: string;
  @ApiProperty() shortName!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ type: [String], description: 'Абзацы истории на главной' })
  about!: string[];
}

export class ProfileTranslationsDto {
  @ApiProperty({ type: ProfileTextDto }) ru!: ProfileTextDto;
  @ApiProperty({ type: ProfileTextDto }) en!: ProfileTextDto;
}

export class AdminProfileDto {
  @ApiProperty() title!: string;
  @ApiProperty() specialization!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ format: 'uri' }) telegramUrl!: string;
  @ApiProperty({ format: 'uri' }) githubUrl!: string;
  @ApiProperty({ format: 'uri' }) linkedinUrl!: string;
  @ApiProperty({ type: ProfileTranslationsDto })
  translations!: ProfileTranslationsDto;
}

// ---------- Коммерческие проекты (опыт работы) ----------

export class ExperienceTextDto {
  @ApiProperty({ type: String, nullable: true }) company!: string | null;
  @ApiProperty() project!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ type: [String] }) responsibilities!: string[];
  @ApiProperty({ type: [String] }) achievements!: string[];
}

export class ExperienceTranslationsDto {
  @ApiProperty({ type: ExperienceTextDto }) ru!: ExperienceTextDto;
  @ApiProperty({ type: ExperienceTextDto }) en!: ExperienceTextDto;
}

export class AdminExperienceInputDto {
  @ApiProperty({ example: 'scooter-admin-crm' }) slug!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ example: '2025-08', description: 'YYYY-MM' })
  startDate!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    example: '2025-11',
    description: 'YYYY-MM, null — работа продолжается',
  })
  endDate!: string | null;
  @ApiProperty({ type: [String] }) stack!: string[];
  @ApiProperty({ type: ExperienceTranslationsDto })
  translations!: ExperienceTranslationsDto;
}

export class AdminExperienceDto extends AdminExperienceInputDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
}

// ---------- Открытые проекты и фриланс ----------

export class ProjectTextDto {
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
}

export class ProjectTranslationsDto {
  @ApiProperty({ type: ProjectTextDto }) ru!: ProjectTextDto;
  @ApiProperty({ type: ProjectTextDto }) en!: ProjectTextDto;
}

export class AdminProjectInputDto {
  @ApiProperty({ example: 'paint-online' }) slug!: string;
  @ApiProperty({ enum: PROJECT_KINDS, enumName: 'ProjectKind' })
  kind!: (typeof PROJECT_KINDS)[number];
  @ApiProperty({ type: [String] }) stack!: string[];
  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  repoUrl!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  liveUrl!: string | null;
  @ApiProperty({ type: ProjectTranslationsDto })
  translations!: ProjectTranslationsDto;
}

export class AdminProjectDto extends AdminProjectInputDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
}

// ---------- Стек ----------

export class SkillCategoryTextDto {
  @ApiProperty() name!: string;
}

export class SkillCategoryTranslationsDto {
  @ApiProperty({ type: SkillCategoryTextDto }) ru!: SkillCategoryTextDto;
  @ApiProperty({ type: SkillCategoryTextDto }) en!: SkillCategoryTextDto;
}

export class AdminSkillCategoryInputDto {
  @ApiProperty({ example: 'frontend' }) slug!: string;
  @ApiProperty({ type: SkillCategoryTranslationsDto })
  translations!: SkillCategoryTranslationsDto;
  @ApiProperty({ type: [String], description: 'Навыки в порядке показа' })
  skills!: string[];
}

export class AdminSkillCategoryDto extends AdminSkillCategoryInputDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
}

// ---------- Общее ----------

export class ReorderDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Все id раздела в новом порядке',
  })
  ids!: string[];
}

// ---------- Резюме ----------

export class AdminCvDto {
  @ApiProperty({
    type: String,
    nullable: true,
    format: 'uri',
    description: 'null — на сайте PDF из сборки',
  })
  ru!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  en!: string | null;
}

export class SetCvDto {
  @ApiProperty({
    format: 'uri',
    example: 'https://abc.public.blob.vercel-storage.com/cv/cv-ru-x1y2.pdf',
    description: 'Только адрес публичного хранилища Vercel Blob',
  })
  url!: string;
}
