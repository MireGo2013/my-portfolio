// Публичный контент сайта на двух языках. Сюда не попадают личные данные из
// резюме (дата рождения, гражданство) и детали под NDA: код, внутренние сервисы,
// имя заказчика Law Portal. Английские тексты взяты из английской версии резюме.

import type { Locale } from '@portfolio/shared';

export const profile = {
  title: 'Fullstack Engineer',
  specialization: 'React / TypeScript / Node.js / NestJS',
  email: 'sobol.work.v92@gmail.com',
  telegramUrl: 'https://t.me/VladilenS_tg',
  githubUrl: 'https://github.com/mirego2013',
  linkedinUrl: 'https://www.linkedin.com/in/vlad-sobol-59458b214/',
  translations: {
    ru: {
      fullName: 'Владислав Соболь',
      summary:
        'Frontend Engineer с 6+ годами коммерческого опыта на React и TypeScript: высоконагруженные SPA, B2B-системы и CRM с ролевым доступом. Проектирую архитектуру frontend-приложений, микрофронтендов и UI Kit, запускаю проекты с нуля, оптимизирую производительность и строю системы тестирования. Backend на Node.js и NestJS, REST API, PostgreSQL и Docker знаю достаточно, чтобы закрыть вертикаль фичи end-to-end.',
    },
    en: {
      fullName: 'Vladislav Sobol',
      summary:
        'Frontend Engineer with 6+ years of commercial experience in React and TypeScript: high-load SPAs, B2B systems and CRMs with role-based access. I design the architecture of frontend applications, microfrontends and UI Kits, launch projects from scratch, optimize performance and build testing systems. I work with Node.js and NestJS, REST APIs, PostgreSQL and Docker, enough to deliver a feature vertical end-to-end.',
    },
  },
};

interface ExperienceSeed {
  slug: string;
  role: string;
  startDate: string;
  endDate: string;
  stack: string[];
  translations: Record<
    Locale,
    {
      company: string | null;
      project: string;
      summary: string;
      highlights: string[];
    }
  >;
}

export const experience: ExperienceSeed[] = [
  {
    slug: 'vtb',
    role: 'Senior Frontend Engineer',
    startDate: '2021-12-01',
    endDate: '2026-07-01',
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
    translations: {
      ru: {
        company: 'ПАО «Банк ВТБ»',
        project: 'Кабинет агента и партнёра, система управления договорами',
        summary:
          'Личный кабинет и система управления договорами для агентов и партнёров банка (СМБ, B2B): оформление договоров, подача заявок, управление банковскими продуктами.',
        highlights: [
          'Спроектировал и внедрил микрофронтенд-архитектуру, провёл масштабный рефакторинг legacy-кода с переходом с Node.js 14 на 24.',
          'Сократил размер bundle более чем на 55% (tree shaking, lazy loading, code splitting, анализ зависимостей), улучшив FCP, LCP и TBT.',
          'Расширил UI Kit с 10 до 30 компонентов, сократив время разработки новых экранов примерно на 40%.',
          'Построил тестирование с нуля и довёл покрытие до 80%: unit-тесты, integration-тесты с настоящим MobX RootStore и моками сети, 30+ e2e-сценариев на Cypress.',
          'Перевёл конфигурацию Webpack и инфраструктурный код на TypeScript; внедрил ESLint, Prettier, Husky, lint-staged и проверки в CI/CD.',
          'Проводил code review, онбординг и менторинг 5 разработчиков, участвовал в планировании и оценке задач.',
        ],
      },
      en: {
        company: 'VTB Bank',
        project: 'Agent & Partner Portal, Contract Management System',
        summary:
          "Self-service portal and contract management system for the bank's agents and partners (SMB, B2B): contract execution, application submission and banking product management.",
        highlights: [
          'Designed and implemented a microfrontend architecture and carried out a large-scale legacy refactoring, upgrading Node.js from 14 to 24.',
          'Reduced bundle size by more than 55% (tree shaking, lazy loading, code splitting, dependency analysis), improving FCP, LCP and TBT.',
          "Expanded the UI Kit from 10 to 30 components, reducing the team's development time for new screens by about 40%.",
          'Built testing from scratch and brought coverage up to 80%: unit tests, integration tests with a real MobX RootStore and mocked network, 30+ e2e scenarios in Cypress.',
          'Migrated the Webpack configuration and infrastructure code to TypeScript; introduced ESLint, Prettier, Husky, lint-staged and CI/CD checks.',
          'Conducted code review, onboarding and mentoring for 5 developers; took part in planning and estimation.',
        ],
      },
    },
  },
  {
    slug: 'scooter-admin-crm',
    role: 'Lead Frontend Engineer',
    startDate: '2025-08-01',
    endDate: '2025-11-01',
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
    translations: {
      ru: {
        company: 'Sparkit / BE Happy',
        project: 'Scooter Admin CRM',
        summary:
          'CRM для управления и мониторинга парка электросамокатов. Единственный frontend-разработчик на проекте.',
        highlights: [
          'Довёл веб-приложение с нуля до рабочего продукта примерно за 3 месяца: выбор стека, архитектура, стандарты команды.',
          'Реализовал ролевой доступ (администратор, оператор, техник) на TanStack Router.',
          'Интегрировал клиент с backend по OpenAPI через openapi-fetch и настроил кэширование на TanStack Query.',
          'Сделал таблицы с сортировкой, фильтрацией и пагинацией и мониторинг парка из 500+ самокатов.',
          'Заложенные архитектура и стандарты стали основой, на которой продукт продолжила развивать штатная команда.',
        ],
      },
      en: {
        company: 'Sparkit / BE Happy',
        project: 'Scooter Admin CRM',
        summary:
          'CRM for managing and monitoring an e-scooter fleet. Sole frontend developer on the project.',
        highlights: [
          'Took the web application from scratch to a working product in about 3 months: stack selection, architecture, team standards.',
          'Implemented role-based access (administrator, operator, technician) using TanStack Router.',
          'Integrated the client with the backend via OpenAPI using openapi-fetch and set up data caching with TanStack Query.',
          'Built tables with sorting, filtering and pagination, and monitoring for a fleet of 500+ vehicles.',
          'The architecture and standards I established became the foundation on which the in-house team continued to develop the product.',
        ],
      },
    },
  },
  {
    slug: 'law-portal',
    role: 'Frontend Engineer',
    startDate: '2020-08-01',
    endDate: '2021-09-01',
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
    translations: {
      ru: {
        company: 'General Soft',
        project: 'Law Portal',
        summary:
          'LegalTech-платформа сопровождения судебных процессов: ведение дел, отслеживание статусов, финансовые данные и ролевой доступ.',
        highlights: [
          'Разработал интерфейсы для более чем шести пользовательских ролей, реализовал авторизацию и ролевой доступ.',
          'Сделал интерактивные дашборды на Recharts для финансовых показателей и статусов дел.',
          'Реализовал внутренний чат на WebSocket и уведомления об изменении статусов дел.',
        ],
      },
      en: {
        company: 'General Soft',
        project: 'Law Portal',
        summary:
          'LegalTech platform supporting legal proceedings: case management, status tracking, financial data and role-based access.',
        highlights: [
          'Developed interfaces for more than six user roles; implemented authentication and role-based access.',
          'Built interactive Recharts dashboards for financial metrics and case statuses.',
          'Implemented the in-app WebSocket chat and notifications about case status changes.',
        ],
      },
    },
  },
  {
    slug: 'kitchen-space',
    role: 'Frontend Engineer',
    startDate: '2020-03-01',
    endDate: '2020-08-01',
    stack: ['React', 'JavaScript', 'Formik', 'Axios', 'Styled Components'],
    translations: {
      ru: {
        company: null,
        project: 'Kitchen Space',
        summary:
          'Платформа аренды коммерческих кухонь: управление заказами и заявками, валидация форм, интеграция с API платежей и счетов.',
        highlights: [],
      },
      en: {
        company: null,
        project: 'Kitchen Space',
        summary:
          'Commercial kitchen rental platform: order and request management, form validation, integration with payment and invoicing APIs.',
        highlights: [],
      },
    },
  },
  {
    slug: 'vezetvsem',
    role: 'Frontend Engineer',
    startDate: '2019-05-01',
    endDate: '2019-12-01',
    stack: ['React', 'JavaScript', 'Flux', 'SCSS', 'Axios'],
    translations: {
      ru: {
        company: null,
        project: 'Vezetvsem',
        summary:
          'Платформа заявок на грузоперевозки: интерфейсы заявок с фильтрацией, сортировкой и поиском, интеграция API статусов доставки.',
        highlights: [],
      },
      en: {
        company: null,
        project: 'Vezetvsem',
        summary:
          'Freight transportation request platform: request interfaces with filtering, sorting and search, integration with delivery status APIs.',
        highlights: [],
      },
    },
  },
];

const github = 'https://github.com/mirego2013';

export const projects = [
  {
    slug: 'offline-dv-photo-studio',
    kind: 'OPEN_SOURCE' as const,
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
    translations: {
      ru: {
        name: 'Offline DV Photo Studio',
        description:
          'Локальное офлайн-приложение для подготовки фото на DV Lottery: кадр 600×600 по нормам, белый фон, проверки файла. Фото не покидает компьютер.',
      },
      en: {
        name: 'Offline DV Photo Studio',
        description:
          'Local offline app for preparing DV Lottery photos: a compliant 600×600 crop, white background and file checks. The photo never leaves the computer.',
      },
    },
  },
  {
    slug: 'music-platform',
    kind: 'OPEN_SOURCE' as const,
    stack: ['Next.js 16', 'NestJS', 'MongoDB', 'Docker Compose'],
    repoUrl: `${github}/music-platform`,
    liveUrl: null,
    translations: {
      ru: {
        name: 'Music Platform',
        description:
          'Музыкальная платформа: API с загрузкой файлов, клиент с постоянным плеером, поиск и альбомы.',
      },
      en: {
        name: 'Music Platform',
        description:
          'Music platform: an API with file uploads and a client with a persistent player, search and albums.',
      },
    },
  },
  {
    slug: 'mini-consultant-chat',
    kind: 'OPEN_SOURCE' as const,
    stack: ['Next.js 15', 'TanStack Query', 'WebSocket'],
    repoUrl: `${github}/mini-consultant-chat`,
    liveUrl: null,
    translations: {
      ru: {
        name: 'Mini Consultant Chat',
        description:
          'Чат с консультантом: серверный рендер списка встреч и чат на WebSocket с переподключением и очередью отправки.',
      },
      en: {
        name: 'Mini Consultant Chat',
        description:
          'Consultant chat: server-rendered list of meetings and a WebSocket chat with reconnection and a send queue.',
      },
    },
  },
  {
    slug: 'paint-online',
    kind: 'OPEN_SOURCE' as const,
    stack: ['React', 'Canvas', 'MobX', 'Express', 'WebSocket'],
    repoUrl: `${github}/paint-online`,
    liveUrl: null,
    translations: {
      ru: {
        name: 'Paint Online',
        description:
          'Совместный графический редактор, работающий в реальном времени.',
      },
      en: {
        name: 'Paint Online',
        description: 'Collaborative graphics editor working in real time.',
      },
    },
  },
  {
    slug: 'real-time-server-types',
    kind: 'OPEN_SOURCE' as const,
    stack: ['React 19', 'TypeScript', 'Express 5', 'ws'],
    repoUrl: `${github}/real-time-server-types`,
    liveUrl: null,
    translations: {
      ru: {
        name: 'Real-time Server Types',
        description:
          'Чат с комнатами на трёх транспортах для сравнения: long polling, Server-Sent Events и WebSocket.',
      },
      en: {
        name: 'Real-time Server Types',
        description:
          'Chat with rooms on three transports for comparison: long polling, Server-Sent Events and WebSocket.',
      },
    },
  },
  {
    slug: 'jwt-authorization',
    kind: 'OPEN_SOURCE' as const,
    stack: ['React', 'MobX', 'Express 5', 'MongoDB'],
    repoUrl: `${github}/JWT-authorization`,
    liveUrl: null,
    translations: {
      ru: {
        name: 'JWT Authorization',
        description:
          'JWT-авторизация: access- и refresh-токены, активация аккаунта по почте, бесшовное обновление токенов.',
      },
      en: {
        name: 'JWT Authorization',
        description:
          'JWT authorization: access and refresh tokens, account activation by email, seamless token refresh.',
      },
    },
  },
  {
    slug: 'nestjs-course-project',
    kind: 'OPEN_SOURCE' as const,
    stack: ['NestJS', 'PostgreSQL', 'Sequelize', 'Swagger', 'Docker'],
    repoUrl: `${github}/nestjs-course-project`,
    liveUrl: null,
    translations: {
      ru: {
        name: 'NestJS Course Project',
        description:
          'Учебный REST API: регистрация и вход по JWT, роли и бан, посты с картинками.',
      },
      en: {
        name: 'NestJS Course Project',
        description:
          'Educational REST API: JWT sign-up and sign-in, roles and bans, posts with images.',
      },
    },
  },
  {
    slug: 'telegram-green-api-chat',
    kind: 'OPEN_SOURCE' as const,
    stack: ['React', 'TypeScript', 'Vite', 'GREEN-API'],
    repoUrl: `${github}/telegram-green-api-chat`,
    liveUrl: 'https://mirego2013.github.io/telegram-green-api-chat/',
    translations: {
      ru: {
        name: 'Telegram GREEN-API Chat',
        description:
          'Веб-клиент Telegram на GREEN-API: создание чата по номеру, отправка и приём сообщений в реальном времени.',
      },
      en: {
        name: 'Telegram GREEN-API Chat',
        description:
          'Telegram web client on GREEN-API: creating a chat by phone number, sending and receiving messages in real time.',
      },
    },
  },
  {
    slug: 'sova-family-center',
    kind: 'FREELANCE' as const,
    stack: ['Next.js'],
    repoUrl: null,
    liveUrl: 'https://sovafamilycenter.by',
    translations: {
      ru: {
        name: 'Детский центр «Сова»',
        description:
          'Лендинг детского развивающего центра: направления, отзывы, FAQ, запись на пробное занятие.',
      },
      en: {
        name: 'Sova Children’s Center',
        description:
          'Landing page for a children’s development center: programs, reviews, FAQ, trial class booking.',
      },
    },
  },
  {
    slug: 'beauty-vitebsk',
    kind: 'FREELANCE' as const,
    stack: ['WordPress'],
    repoUrl: null,
    liveUrl: 'https://beauty-vitebsk.by',
    translations: {
      ru: {
        name: 'Салон красоты в Витебске',
        description:
          'Сайт салона красоты: услуги, акции, формы обратной связи, интеграция онлайн-записи.',
      },
      en: {
        name: 'Beauty Salon in Vitebsk',
        description:
          'Beauty salon website: services, promotions, feedback forms, online booking integration.',
      },
    },
  },
];

export const skillCategories = [
  {
    slug: 'languages',
    translations: { ru: { name: 'Языки' }, en: { name: 'Languages' } },
    skills: ['TypeScript', 'JavaScript (ES2023)'],
  },
  {
    slug: 'frontend',
    translations: { ru: { name: 'Frontend' }, en: { name: 'Frontend' } },
    skills: [
      'React',
      'Next.js',
      'React Router',
      'TanStack Router',
      'SSR / SSG',
      'Microfrontends',
      'Feature-Sliced Design',
    ],
  },
  {
    slug: 'state',
    translations: {
      ru: { name: 'Состояние и данные' },
      en: { name: 'State and data' },
    },
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
    translations: { ru: { name: 'UI и формы' }, en: { name: 'UI and forms' } },
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
    translations: { ru: { name: 'Backend' }, en: { name: 'Backend' } },
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
    translations: { ru: { name: 'Тестирование' }, en: { name: 'Testing' } },
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
    translations: {
      ru: { name: 'Инфраструктура и качество' },
      en: { name: 'Infrastructure and quality' },
    },
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
