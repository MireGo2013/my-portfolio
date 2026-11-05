export const ru = {
  nav: {
    label: 'Основная навигация',
    experience: 'Опыт',
    projects: 'Проекты',
    skills: 'Стек',
    contact: 'Контакты',
  },
  language: {
    label: 'Язык сайта',
  },
  hero: {
    contact: 'Связаться',
    viewResume: 'Посмотреть резюме',
    downloadResume: 'Скачать',
    downloadResumeLabel: 'Скачать резюме',
  },
  experience: {
    title: 'Опыт',
    description:
      'Коммерческие проекты под NDA: без кода и скриншотов, зато с задачами и результатами.',
    metaDescription: 'Коммерческие проекты: задачи, достижения и стек.',
    present: 'настоящее время',
  },
  projects: {
    title: 'Проекты',
    description: 'Открытые проекты с кодом на GitHub и работы на фрилансе.',
    openSource: 'Открытые проекты',
    freelance: 'Фриланс',
    code: 'Код',
    site: 'Сайт',
  },
  skills: {
    title: 'Стек',
    description: 'Технологии, с которыми я работаю, по областям.',
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
