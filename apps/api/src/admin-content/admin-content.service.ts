import { Injectable } from '@nestjs/common';
import type {
  ExperienceData,
  Locale,
  ProfileData,
  ProjectData,
  SkillCategoryData,
} from '@portfolio/shared';
import { mapPrismaError, notFound } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AdminCvDto,
  AdminExperienceDto,
  AdminProfileDto,
  AdminProjectDto,
  AdminSkillCategoryDto,
  ExperienceTextDto,
  ProjectTextDto,
} from './admin-content.dto.js';
import {
  assertSameIds,
  byLocale,
  dateToMonth,
  monthToDate,
  toTranslationRows,
} from './content-helpers.js';

type Delegate = 'experience' | 'project' | 'skillCategory';

const experienceSelect = {
  id: true,
  slug: true,
  role: true,
  startDate: true,
  endDate: true,
  stack: true,
  translations: {
    select: {
      locale: true,
      company: true,
      project: true,
      summary: true,
      responsibilities: true,
      achievements: true,
    },
  },
} as const;

const projectSelect = {
  id: true,
  slug: true,
  kind: true,
  stack: true,
  repoUrl: true,
  liveUrl: true,
  translations: { select: { locale: true, name: true, description: true } },
} as const;

const skillCategorySelect = {
  id: true,
  slug: true,
  translations: { select: { locale: true, name: true } },
  skills: { orderBy: { position: 'asc' }, select: { name: true } },
} as const;

/**
 * Редактирование публичного контента. В отличие от публичных сервисов,
 * отдаёт тексты сразу на всех языках: в форме они стоят рядом.
 */
@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Профиль ----------

  async getProfile(): Promise<AdminProfileDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: 1 },
      include: {
        translations: {
          select: {
            locale: true,
            fullName: true,
            shortName: true,
            summary: true,
            about: true,
          },
        },
      },
    });
    if (!profile) throw notFound();
    const { id, translations, ...shared } = profile;
    return { ...shared, translations: byLocale(translations) };
  }

  async updateProfile(input: ProfileData): Promise<AdminProfileDto> {
    const { translations, ...shared } = input;
    await this.prisma.$transaction([
      this.prisma.profile.upsert({
        where: { id: 1 },
        create: { id: 1, ...shared },
        update: shared,
      }),
      ...toTranslationRows(translations).map(({ locale, ...text }) =>
        this.prisma.profileTranslation.upsert({
          where: { profileId_locale: { profileId: 1, locale } },
          create: { profileId: 1, locale, ...text },
          update: text,
        }),
      ),
    ]);
    return this.getProfile();
  }

  // ---------- Коммерческие проекты ----------

  async listExperience(): Promise<AdminExperienceDto[]> {
    const rows = await this.prisma.experience.findMany({
      orderBy: { position: 'asc' },
      select: experienceSelect,
    });
    return rows.map(toExperienceDto);
  }

  async getExperience(id: string): Promise<AdminExperienceDto> {
    const row = await this.prisma.experience.findUnique({
      where: { id },
      select: experienceSelect,
    });
    if (!row) throw notFound();
    return toExperienceDto(row);
  }

  async createExperience(input: ExperienceData): Promise<AdminExperienceDto> {
    const { translations, ...data } = input;
    try {
      const row = await this.prisma.experience.create({
        data: {
          ...experienceData(data),
          position: await this.nextPosition('experience'),
          translations: { create: toTranslationRows(translations) },
        },
        select: experienceSelect,
      });
      return toExperienceDto(row);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async updateExperience(
    id: string,
    input: ExperienceData,
  ): Promise<AdminExperienceDto> {
    const { translations, ...data } = input;
    try {
      await this.prisma.$transaction([
        this.prisma.experience.update({
          where: { id },
          data: experienceData(data),
        }),
        ...toTranslationRows(translations).map(({ locale, ...text }) =>
          this.prisma.experienceTranslation.upsert({
            where: { experienceId_locale: { experienceId: id, locale } },
            create: { experienceId: id, locale, ...text },
            update: text,
          }),
        ),
      ]);
    } catch (error) {
      mapPrismaError(error);
    }
    return this.getExperience(id);
  }

  async deleteExperience(id: string): Promise<void> {
    await this.prisma.experience
      .delete({ where: { id } })
      .catch(mapPrismaError);
  }

  async reorderExperience(ids: string[]): Promise<AdminExperienceDto[]> {
    await this.reorder('experience', ids);
    return this.listExperience();
  }

  // ---------- Открытые проекты и фриланс ----------

  async listProjects(): Promise<AdminProjectDto[]> {
    const rows = await this.prisma.project.findMany({
      orderBy: { position: 'asc' },
      select: projectSelect,
    });
    return rows.map(toProjectDto);
  }

  async getProject(id: string): Promise<AdminProjectDto> {
    const row = await this.prisma.project.findUnique({
      where: { id },
      select: projectSelect,
    });
    if (!row) throw notFound();
    return toProjectDto(row);
  }

  async createProject(input: ProjectData): Promise<AdminProjectDto> {
    const { translations, ...data } = input;
    try {
      const row = await this.prisma.project.create({
        data: {
          ...data,
          position: await this.nextPosition('project'),
          translations: { create: toTranslationRows(translations) },
        },
        select: projectSelect,
      });
      return toProjectDto(row);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async updateProject(
    id: string,
    input: ProjectData,
  ): Promise<AdminProjectDto> {
    const { translations, ...data } = input;
    try {
      await this.prisma.$transaction([
        this.prisma.project.update({ where: { id }, data }),
        ...toTranslationRows(translations).map(({ locale, ...text }) =>
          this.prisma.projectTranslation.upsert({
            where: { projectId_locale: { projectId: id, locale } },
            create: { projectId: id, locale, ...text },
            update: text,
          }),
        ),
      ]);
    } catch (error) {
      mapPrismaError(error);
    }
    return this.getProject(id);
  }

  async deleteProject(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } }).catch(mapPrismaError);
  }

  async reorderProjects(ids: string[]): Promise<AdminProjectDto[]> {
    await this.reorder('project', ids);
    return this.listProjects();
  }

  // ---------- Стек ----------

  async listSkills(): Promise<AdminSkillCategoryDto[]> {
    const rows = await this.prisma.skillCategory.findMany({
      orderBy: { position: 'asc' },
      select: skillCategorySelect,
    });
    return rows.map(toSkillCategoryDto);
  }

  async getSkillCategory(id: string): Promise<AdminSkillCategoryDto> {
    const row = await this.prisma.skillCategory.findUnique({
      where: { id },
      select: skillCategorySelect,
    });
    if (!row) throw notFound();
    return toSkillCategoryDto(row);
  }

  async createSkillCategory(
    input: SkillCategoryData,
  ): Promise<AdminSkillCategoryDto> {
    try {
      const row = await this.prisma.skillCategory.create({
        data: {
          slug: input.slug,
          position: await this.nextPosition('skillCategory'),
          translations: { create: toTranslationRows(input.translations) },
          skills: { create: skillRows(input.skills) },
        },
        select: skillCategorySelect,
      });
      return toSkillCategoryDto(row);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  /** Навыки заменяются целиком: порядок в списке и есть порядок на сайте. */
  async updateSkillCategory(
    id: string,
    input: SkillCategoryData,
  ): Promise<AdminSkillCategoryDto> {
    try {
      await this.prisma.$transaction([
        this.prisma.skillCategory.update({
          where: { id },
          data: { slug: input.slug },
        }),
        ...toTranslationRows(input.translations).map(({ locale, name }) =>
          this.prisma.skillCategoryTranslation.upsert({
            where: { categoryId_locale: { categoryId: id, locale } },
            create: { categoryId: id, locale, name },
            update: { name },
          }),
        ),
        this.prisma.skill.deleteMany({ where: { categoryId: id } }),
        this.prisma.skill.createMany({
          data: skillRows(input.skills).map((row) => ({
            ...row,
            categoryId: id,
          })),
        }),
      ]);
    } catch (error) {
      mapPrismaError(error);
    }
    return this.getSkillCategory(id);
  }

  async deleteSkillCategory(id: string): Promise<void> {
    await this.prisma.skillCategory
      .delete({ where: { id } })
      .catch(mapPrismaError);
  }

  async reorderSkills(ids: string[]): Promise<AdminSkillCategoryDto[]> {
    await this.reorder('skillCategory', ids);
    return this.listSkills();
  }

  // ---------- Резюме ----------

  /** Адреса загруженных резюме. null — сайт отдаёт PDF из сборки. */
  async getCv(): Promise<AdminCvDto> {
    const rows = await this.prisma.profileTranslation.findMany({
      where: { profileId: 1 },
      select: { locale: true, cvUrl: true },
    });
    const urls = byLocale(rows);
    return { ru: urls.ru.cvUrl, en: urls.en.cvUrl };
  }

  /**
   * Ставит или снимает адрес резюме на одном языке. Сам файл загружает
   * и удаляет сервер сайта: доступ к хранилищу Blob есть только у него.
   * Возвращает и прежний адрес, чтобы сайт мог удалить старый файл.
   */
  async setCv(
    locale: Locale,
    url: string | null,
  ): Promise<AdminCvDto & { previous: string | null }> {
    const current = await this.prisma.profileTranslation.findUnique({
      where: { profileId_locale: { profileId: 1, locale } },
      select: { cvUrl: true },
    });
    if (!current) throw notFound('Профиль ещё не заполнен');

    await this.prisma.profileTranslation.update({
      where: { profileId_locale: { profileId: 1, locale } },
      data: { cvUrl: url },
    });
    return { ...(await this.getCv()), previous: current.cvUrl };
  }

  // ---------- Общее ----------

  /** Новая запись встаёт в конец раздела. */
  private async nextPosition(model: Delegate): Promise<number> {
    const { _max } = await this.positionDelegate(model).aggregate({
      _max: { position: true },
    });
    return (_max.position ?? -1) + 1;
  }

  private async reorder(model: Delegate, ids: string[]): Promise<void> {
    const delegate = this.positionDelegate(model);
    const existing = await delegate.findMany({ select: { id: true } });
    assertSameIds(
      existing.map((row) => row.id),
      ids,
    );
    // Позиции не уникальны в схеме, поэтому их можно переписать по одной
    await this.prisma.$transaction(
      ids.map((id, position) =>
        delegate.update({ where: { id }, data: { position } }),
      ),
    );
  }

  /** Три модели с одинаковыми полями id и position. */
  private positionDelegate(model: Delegate) {
    // Делегаты Prisma разных моделей несовместимы по типам, хотя нужные
    // методы у них одинаковые. Сужаем до общего минимума
    return this.prisma[model] as unknown as {
      aggregate(args: {
        _max: { position: true };
      }): Promise<{ _max: { position: number | null } }>;
      findMany(args: { select: { id: true } }): Promise<{ id: string }[]>;
      update(args: {
        where: { id: string };
        data: { position: number };
      }): ReturnType<PrismaService['experience']['update']>;
    };
  }
}

function experienceData(data: Omit<ExperienceData, 'translations'>) {
  return {
    ...data,
    startDate: monthToDate(data.startDate),
    endDate: data.endDate ? monthToDate(data.endDate) : null,
  };
}

function skillRows(skills: string[]) {
  return skills.map((name, position) => ({ name, position }));
}

type Translated<T> = (T & { locale: Locale })[];

type ExperienceRow = Omit<
  AdminExperienceDto,
  'startDate' | 'endDate' | 'translations'
> & {
  startDate: Date;
  endDate: Date | null;
  translations: Translated<ExperienceTextDto>;
};

function toExperienceDto(row: ExperienceRow): AdminExperienceDto {
  return {
    ...row,
    startDate: dateToMonth(row.startDate),
    endDate: row.endDate && dateToMonth(row.endDate),
    translations: byLocale(row.translations),
  };
}

function toProjectDto(
  row: Omit<AdminProjectDto, 'translations'> & {
    translations: Translated<ProjectTextDto>;
  },
): AdminProjectDto {
  return { ...row, translations: byLocale(row.translations) };
}

function toSkillCategoryDto(row: {
  id: string;
  slug: string;
  translations: Translated<{ name: string }>;
  skills: { name: string }[];
}): AdminSkillCategoryDto {
  return {
    id: row.id,
    slug: row.slug,
    translations: byLocale(row.translations),
    skills: row.skills.map((skill) => skill.name),
  };
}
