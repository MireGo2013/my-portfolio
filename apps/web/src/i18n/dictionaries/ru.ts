export const ru = {
  nav: {
    label: 'Основная навигация',
    about: 'Обо мне',
    projects: 'Проекты',
    skills: 'Стек',
    experience: 'Опыт',
    contact: 'Контакты',
  },
  social: {
    label: 'Ссылки на профили',
  },
  language: {
    label: 'Язык сайта',
  },
  about: {
    greeting: 'Привет, меня зовут',
    viewResume: 'Посмотреть резюме',
    downloadResume: 'Скачать',
    downloadResumeLabel: 'Скачать резюме',
    skillsLabel: 'Навыки и инструменты',
  },
  projects: {
    title: 'Проекты',
    description:
      'Коммерческие проекты под NDA: без кода и скриншотов, зато с задачами и результатами.',
    metaDescription:
      'Коммерческие проекты: обязанности, достижения и стек. Фриланс.',
    present: 'настоящее время',
    responsibilities: 'Задачи и зона ответственности',
    achievements: 'Результаты и достижения',
    stack: 'Стек на проекте',
    freelance: 'Фриланс',
  },
  experience: {
    title: 'Опыт',
    description:
      'Открытые проекты на GitHub: навыки, которые можно проверить по коду.',
    allProjects: 'Все репозитории на GitHub',
    code: 'Код',
    site: 'Сайт',
  },
  skills: {
    title: 'Стек',
    description: 'Технологии и инструменты, с которыми я работаю, по областям.',
  },
  contact: {
    title: 'Контакты',
    description: 'Напишите через форму или любым удобным способом.',
    metaDescription:
      'Форма обратной связи, email, Telegram, GitHub и LinkedIn.',
    form: {
      name: 'Имя',
      email: 'Email',
      message: 'Сообщение',
      honeypot: 'Сайт',
      submit: 'Отправить',
      sending: 'Отправка...',
      results: {
        sent: 'Сообщение отправлено. Спасибо, отвечу в ближайшее время!',
        'rate-limited':
          'Слишком много отправок с вашего адреса. Попробуйте позже или напишите напрямую.',
        failed:
          'Не удалось отправить сообщение. Попробуйте ещё раз или напишите напрямую.',
      },
      errors: {
        nameTooShort: 'Укажите имя: минимум 2 символа',
        nameTooLong: 'Слишком длинное имя: максимум 100 символов',
        emailTooLong: 'Слишком длинный адрес',
        emailInvalid: 'Укажите корректный email',
        messageTooShort: 'Напишите сообщение: минимум 10 символов',
        messageTooLong: 'Слишком длинное сообщение: максимум 5000 символов',
      },
    },
  },
  notFound: {
    title: 'Страница не найдена',
    description: 'Возможно, адрес изменился или в нём опечатка.',
    home: 'На главную',
  },
};

export type Dictionary = typeof ru;
