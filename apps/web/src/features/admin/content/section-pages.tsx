'use client';

import { useParams } from 'next/navigation';
import { ContentEditor } from './content-editor';
import { ContentList } from './content-list';
import { WorkForm, ProjectForm, SkillCategoryForm } from './section-forms';

// Страницы разделов контента. id записи берём из адреса: данные админки
// грузятся в браузере, как и в сообщениях

const useRecordId = () => useParams<{ id?: string }>().id;

const period = (start: string, end: string | null) =>
  `${start} — ${end ?? 'сейчас'}`;

export function WorkListPage() {
  return (
    <ContentList
      section="work"
      title="Проекты"
      description="Коммерческие проекты: работа в компаниях, обязанности и достижения"
      describe={(item) => ({
        title: item.translations.ru.project,
        subtitle: [
          item.translations.ru.company,
          item.role,
          period(item.startDate, item.endDate),
        ]
          .filter(Boolean)
          .join(' · '),
      })}
    />
  );
}

export function WorkEditPage() {
  const id = useRecordId();
  return (
    <ContentEditor
      section="work"
      id={id}
      title={(record) => record?.translations.ru.project ?? 'Новый проект'}
    >
      {(record) => <WorkForm record={record} />}
    </ContentEditor>
  );
}

export function ProjectListPage() {
  return (
    <ContentList
      section="projects"
      title="Опыт"
      description="Открытые проекты на GitHub и фриланс: ссылки на код и сайт"
      describe={(item) => ({
        title: item.translations.ru.name,
        subtitle: [
          item.kind === 'FREELANCE' ? 'Фриланс' : 'Открытый проект',
          item.stack.slice(0, 4).join(', '),
        ]
          .filter(Boolean)
          .join(' · '),
      })}
    />
  );
}

export function ProjectEditPage() {
  const id = useRecordId();
  return (
    <ContentEditor
      section="projects"
      id={id}
      title={(record) => record?.translations.ru.name ?? 'Новый проект'}
    >
      {(record) => <ProjectForm record={record} />}
    </ContentEditor>
  );
}

export function SkillsListPage() {
  return (
    <ContentList
      section="skills"
      title="Стек"
      description="Группы навыков и навыки в них, в порядке показа на сайте"
      describe={(item) => ({
        title: item.translations.ru.name,
        subtitle: item.skills.join(', '),
      })}
    />
  );
}

export function SkillCategoryEditPage() {
  const id = useRecordId();
  return (
    <ContentEditor
      section="skills"
      id={id}
      title={(record) => record?.translations.ru.name ?? 'Новая группа'}
    >
      {(record) => <SkillCategoryForm record={record} />}
    </ContentEditor>
  );
}
