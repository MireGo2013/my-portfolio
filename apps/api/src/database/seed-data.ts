// Публичный контент сайта. Сюда не попадают личные данные из резюме (дата
// рождения, гражданство) и детали под NDA: код, внутренние сервисы, имя
// заказчика Law Portal.

export const profile = {
  fullName: 'Владислав Соболь',
  title: 'Fullstack Engineer',
  specialization: 'React / TypeScript / Node.js / NestJS',
  summary:
    'Frontend Engineer с 6+ годами коммерческого опыта на React и TypeScript: высоконагруженные SPA, B2B-системы и CRM с ролевым доступом. Проектирую архитектуру frontend-приложений, микрофронтендов и UI Kit, запускаю проекты с нуля, оптимизирую производительность и строю системы тестирования. Backend на Node.js и NestJS, REST API, PostgreSQL и Docker знаю достаточно, чтобы закрыть вертикаль фичи end-to-end.',
  email: 'sobol.work.v92@gmail.com',
  telegramUrl: 'https://t.me/VladilenS_tg',
  githubUrl: 'https://github.com/mirego2013',
};

export const experience = [
  {
    slug: 'vtb',
    company: 'ВТБ',
    project: 'Кабинет агента и партнёра, система управления договорами',
    role: 'Senior Frontend Engineer',
    summary:
      'Личный кабинет и система управления договорами для агентов и партнёров банка (СМБ, B2B): оформление договоров, подача заявок, управление банковскими продуктами.',
    startDate: '2021-12-01',
    endDate: '2026-07-01',
    highlights: [
      'Спроектировал и внедрил микрофронтенд-архитектуру, провёл масштабный рефакторинг legacy-кода с переходом с Node.js 14 на 24.',
      'Сократил размер bundle более чем на 55% (tree shaking, lazy loading, code splitting, анализ зависимостей), улучшив FCP, LCP и TBT.',
      'Расширил UI Kit с 10 до 30 компонентов, сократив время разработки новых экранов примерно на 40%.',
      'Построил тестирование с нуля и довёл покрытие до 80%: unit-тесты, integration-тесты с настоящим MobX RootStore и моками сети, 30+ e2e-сценариев на Cypress.',
      'Перевёл конфигурацию Webpack и инфраструктурный код на TypeScript; внедрил ESLint, Prettier, Husky, lint-staged и проверки в CI/CD.',
      'Проводил code review, онбординг и менторинг 5 разработчиков, участвовал в планировании и оценке задач.',
    ],
    stack: [
      'React',
      'TypeScript',
      'MobX',
      'React Router',
      'Webpack',
      'Jest',
      'React Testing Library',
      'Cypress',
      'Docker',
      'Nginx',
    ],
  },
  {
    slug: 'scooter-admin-crm',
    company: 'Sparkit / BE Happy',
    project: 'Scooter Admin CRM',
    role: 'Lead Frontend Engineer',
    summary:
      'CRM для управления и мониторинга парка электросамокатов. Единственный frontend-разработчик на проекте.',
    startDate: '2025-08-01',
    endDate: '2025-11-01',
    highlights: [
      'Довёл веб-приложение с нуля до рабочего продукта примерно за 3 месяца: выбор стека, архитектура, стандарты команды.',
      'Реализовал ролевой доступ (администратор, оператор, техник) на TanStack Router.',
      'Интегрировал клиент с backend по OpenAPI через openapi-fetch и настроил кэширование на TanStack Query.',
      'Сделал таблицы с сортировкой, фильтрацией и пагинацией и мониторинг парка из 500+ самокатов.',
      'Заложенные архитектура и стандарты стали основой, на которой продукт продолжила развивать штатная команда.',
    ],
    stack: [
      'React',
      'TypeScript',
      'TanStack Query',
      'TanStack Router',
      'openapi-fetch',
      'Zustand',
      'Tailwind CSS',
      'HeroUI',
      'Vite',
    ],
  },
  {
    slug: 'law-portal',
    company: 'General Soft',
    project: 'Law Portal',
    role: 'Frontend Engineer',
    summary:
      'LegalTech-платформа сопровождения судебных процессов: ведение дел, отслеживание статусов, финансовые данные и ролевой доступ.',
    startDate: '2020-08-01',
    endDate: '2021-09-01',
    highlights: [
      'Разработал интерфейсы для более чем шести пользовательских ролей, реализовал авторизацию и ролевой доступ.',
      'Сделал интерактивные дашборды на Recharts для финансовых показателей и статусов дел.',
      'Реализовал внутренний чат на WebSocket и уведомления об изменении статусов дел.',
    ],
    stack: [
      'React',
      'JavaScript',
      'Redux',
      'React Router',
      'Recharts',
      'Styled Components',
      'WebSocket',
      'Docker',
    ],
  },
  {
    slug: 'kitchen-space',
    company: null,
    project: 'Kitchen Space',
    role: 'Frontend Engineer',
    summary:
      'Платформа аренды коммерческих кухонь: управление заказами и заявками, валидация форм, интеграция с API платежей и счетов.',
    startDate: '2020-03-01',
    endDate: '2020-08-01',
    highlights: [],
    stack: ['React', 'JavaScript', 'Formik', 'Axios', 'Styled Components'],
  },
  {
    slug: 'vezetvsem',
    company: null,
    project: 'Vezetvsem',
    role: 'Frontend Engineer',
    summary:
      'Платформа заявок на грузоперевозки: интерфейсы заявок с фильтрацией, сортировкой и поиском, интеграция API статусов доставки.',
    startDate: '2019-05-01',
    endDate: '2019-12-01',
    highlights: [],
    stack: ['React', 'JavaScript', 'Flux', 'SCSS', 'Axios'],
  },
];

const github = 'https://github.com/mirego2013';

export const projects = [
  {
    slug: 'offline-dv-photo-studio',
    name: 'Offline DV Photo Studio',
    kind: 'OPEN_SOURCE',
    description:
      'Локальное офлайн-приложение для подготовки фото на DV Lottery: кадр 600×600 по нормам, белый фон, проверки файла. Фото не покидает компьютер.',
    stack: [
      'React 19',
      'TypeScript',
      'Web Worker',
      'MediaPipe',
      'Vitest',
      'Playwright',
    ],
    repoUrl: `${github}/offline-dv-photo-studio`,
    liveUrl: null,
  },
  {
    slug: 'music-platform',
    name: 'Music Platform',
    kind: 'OPEN_SOURCE',
    description:
      'Музыкальная платформа: API с загрузкой файлов, клиент с постоянным плеером, поиск и альбомы.',
    stack: ['Next.js 16', 'NestJS', 'MongoDB', 'Docker Compose'],
    repoUrl: `${github}/music-platform`,
    liveUrl: null,
  },
  {
    slug: 'mini-consultant-chat',
    name: 'Mini Consultant Chat',
    kind: 'OPEN_SOURCE',
    description:
      'Чат с консультантом: серверный рендер списка встреч и чат на WebSocket с переподключением и очередью отправки.',
    stack: ['Next.js 15', 'TanStack Query', 'WebSocket'],
    repoUrl: `${github}/mini-consultant-chat`,
    liveUrl: null,
  },
  {
    slug: 'paint-online',
    name: 'Paint Online',
    kind: 'OPEN_SOURCE',
    description:
      'Совместный графический редактор, работающий в реальном времени.',
    stack: ['React', 'Canvas', 'MobX', 'Express', 'WebSocket'],
    repoUrl: `${github}/paint-online`,
    liveUrl: null,
  },
  {
    slug: 'real-time-server-types',
    name: 'Real-time Server Types',
    kind: 'OPEN_SOURCE',
    description:
      'Чат с комнатами на трёх транспортах для сравнения: long polling, Server-Sent Events и WebSocket.',
    stack: ['React 19', 'TypeScript', 'Express 5', 'ws'],
    repoUrl: `${github}/real-time-server-types`,
    liveUrl: null,
  },
  {
    slug: 'jwt-authorization',
    name: 'JWT Authorization',
    kind: 'OPEN_SOURCE',
    description:
      'JWT-авторизация: access- и refresh-токены, активация аккаунта по почте, бесшовное обновление токенов.',
    stack: ['React', 'MobX', 'Express 5', 'MongoDB'],
    repoUrl: `${github}/JWT-authorization`,
    liveUrl: null,
  },
  {
    slug: 'nestjs-course-project',
    name: 'NestJS Course Project',
    kind: 'OPEN_SOURCE',
    description:
      'Учебный REST API: регистрация и вход по JWT, роли и бан, посты с картинками.',
    stack: ['NestJS', 'PostgreSQL', 'Sequelize', 'Swagger', 'Docker'],
    repoUrl: `${github}/nestjs-course-project`,
    liveUrl: null,
  },
  {
    slug: 'telegram-green-api-chat',
    name: 'Telegram GREEN-API Chat',
    kind: 'OPEN_SOURCE',
    description:
      'Веб-клиент Telegram на GREEN-API: создание чата по номеру, отправка и приём сообщений в реальном времени.',
    stack: ['React', 'TypeScript', 'Vite', 'GREEN-API'],
    repoUrl: `${github}/telegram-green-api-chat`,
    liveUrl: 'https://mirego2013.github.io/telegram-green-api-chat/',
  },
  {
    slug: 'sova-family-center',
    name: 'Детский центр «Сова»',
    kind: 'FREELANCE',
    description:
      'Лендинг детского развивающего центра: направления, отзывы, FAQ, запись на пробное занятие.',
    stack: ['Next.js'],
    repoUrl: null,
    liveUrl: 'https://sovafamilycenter.by',
  },
  {
    slug: 'beauty-vitebsk',
    name: 'Салон красоты в Витебске',
    kind: 'FREELANCE',
    description:
      'Сайт салона красоты: услуги, акции, формы обратной связи, интеграция онлайн-записи.',
    stack: ['WordPress'],
    repoUrl: null,
    liveUrl: 'https://beauty-vitebsk.by',
  },
] as const;

export const skillCategories = [
  {
    slug: 'languages',
    name: 'Языки',
    skills: ['TypeScript', 'JavaScript (ES2023)'],
  },
  {
    slug: 'frontend',
    name: 'Frontend',
    skills: [
      'React',
      'Next.js',
      'React Router',
      'TanStack Router',
      'SSR / SSG',
      'Микрофронтенды',
      'Feature-Sliced Design',
    ],
  },
  {
    slug: 'state',
    name: 'Состояние и данные',
    skills: [
      'MobX',
      'Redux Toolkit',
      'RTK Query',
      'Zustand',
      'TanStack Query',
      'openapi-fetch',
      'Axios',
      'WebSocket',
    ],
  },
  {
    slug: 'ui',
    name: 'UI и формы',
    skills: [
      'Tailwind CSS',
      'Material UI',
      'Ant Design',
      'HeroUI',
      'Styled Components',
      'CSS Modules',
      'SCSS',
      'React Hook Form',
      'Formik',
      'Zod',
    ],
  },
  {
    slug: 'backend',
    name: 'Backend',
    skills: [
      'Node.js',
      'NestJS',
      'Express',
      'REST API',
      'OpenAPI',
      'PostgreSQL',
      'MongoDB',
      'Prisma',
    ],
  },
  {
    slug: 'testing',
    name: 'Тестирование',
    skills: [
      'Jest',
      'Vitest',
      'React Testing Library',
      'Cypress',
      'Playwright',
    ],
  },
  {
    slug: 'devops',
    name: 'Инфраструктура и качество',
    skills: [
      'Docker',
      'Nginx',
      'GitLab',
      'CI/CD',
      'Vite',
      'Webpack',
      'Babel',
      'ESLint',
      'Prettier',
      'Husky',
      'lint-staged',
    ],
  },
];
