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
      shortName: 'Влад',
      about: [
        'Я frontend-разработчик с 6+ годами коммерческого опыта на React и TypeScript. Работал над высоконагруженными SPA, B2B-системами и CRM с ролевым доступом в банковском секторе, LegalTech, логистике и микромобильности.',
        'Проектирую архитектуру frontend-приложений, микрофронтендов и UI Kit, запускаю проекты с нуля, оптимизирую производительность и строю системы тестирования. Провожу code review, онбординг и менторинг, работаю в кросс-функциональной команде полного цикла.',
        'Работаю с Node.js (NestJS, Express), проектирую и интегрирую REST API (OpenAPI), имею практический опыт с PostgreSQL, MongoDB, Docker и Nginx. Этого хватает, чтобы закрыть вертикаль фичи end-to-end.',
      ],
      summary:
        'Frontend Engineer с 6+ годами коммерческого опыта на React и TypeScript: высоконагруженные SPA, B2B-системы и CRM с ролевым доступом. Проектирую архитектуру frontend-приложений, микрофронтендов и UI Kit, запускаю проекты с нуля, оптимизирую производительность и строю системы тестирования. Backend на Node.js и NestJS, REST API, PostgreSQL и Docker знаю достаточно, чтобы закрыть вертикаль фичи end-to-end.',
    },
    en: {
      fullName: 'Vladislav Sobol',
      shortName: 'Vlad',
      about: [
        'I am a Frontend Engineer with 6+ years of commercial experience in React and TypeScript. I have worked on high-load SPAs, B2B systems and CRMs with role-based access in banking, LegalTech, logistics and micromobility.',
        'I design the architecture of frontend applications, microfrontends and UI Kits, launch projects from scratch, optimize performance and build testing systems. I conduct code review, onboarding and mentoring, and work in cross-functional full-cycle teams.',
        'I work with Node.js (NestJS, Express), design and integrate REST APIs (OpenAPI), and have hands-on experience with PostgreSQL, MongoDB, Docker and Nginx. That is enough to deliver a feature vertical end-to-end.',
      ],
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
      responsibilities: string[];
      achievements: string[];
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
      'JavaScript',
      'MobX',
      'React Router',
      'REST API',
      'Axios',
      'Webpack',
      'Babel',
      'Docker',
      'Nginx',
      'Git',
      'CI/CD',
      'Jest',
      'React Testing Library',
      'Cypress',
      'SPA',
      'Microfrontend',
      'Feature-Sliced Design',
    ],
    translations: {
      ru: {
        company: 'ПАО «Банк ВТБ»',
        project: 'Кабинет агента и партнёра, система управления договорами',
        summary:
          'Личный кабинет (СМБ) и система управления договорами для агентов и партнёров банка: оформление договоров, подача заявок, управление банковскими продуктами.',
        responsibilities: [
          'Разрабатывал клиентские интерфейсы личного кабинета агентов и партнёров для оформления договоров, подачи заявок и управления банковскими продуктами.',
          'Спроектировал и внедрил микрофронтенд-архитектуру приложения, провёл масштабный рефакторинг legacy-кода с переходом с Node.js 14 на 24.',
          'Развивал внутренний UI Kit переиспользуемых компонентов.',
          'Построил тестирование с нуля: unit-тесты, integration-тесты с настоящим MobX RootStore и моками сети, e2e на Cypress.',
          'Перевёл конфигурацию Webpack и инфраструктурные настройки с JavaScript на TypeScript.',
          'Внедрил инженерные практики качества кода: ESLint, Prettier, Husky, lint-staged, проверки в CI/CD.',
          'Проводил code review, онбординг и менторинг 5 разработчиков, распределял задачи, участвовал в планировании и оценке.',
        ],
        achievements: [
          'Сократил размер bundle более чем на 55% (tree shaking, lazy loading, code splitting, анализ зависимостей): уменьшился объём загружаемого JavaScript, улучшились FCP, LCP и TBT.',
          'Расширил UI Kit с 10 до 30 компонентов, сократив время разработки новых экранов для команды примерно на 40%.',
          'Довёл покрытие кода тестами до 80%, написал 30+ e2e-сценариев.',
          'Автоматизировал проверку кода перед коммитами и релизами.',
        ],
      },
      en: {
        company: 'VTB Bank',
        project: 'Agent & Partner Portal, Contract Management System',
        summary:
          "Self-service portal (SMB) and contract management system for the bank's agents and partners: contract execution, application submission and banking product management.",
        responsibilities: [
          'Developed client-facing interfaces of the agent and partner portal for contract execution, application submission and banking product management.',
          "Designed and implemented the application's microfrontend architecture and carried out a large-scale legacy refactoring, upgrading Node.js from 14 to 24.",
          'Developed the internal UI Kit of reusable components.',
          'Built testing from scratch: unit tests, integration tests with a real MobX RootStore and mocked network, e2e in Cypress.',
          'Migrated the Webpack configuration and infrastructure settings from JavaScript to TypeScript.',
          'Introduced code quality practices: ESLint, Prettier, Husky, lint-staged, checks in CI/CD.',
          'Conducted code review, onboarding and mentoring for 5 developers; distributed tasks, took part in planning and estimation.',
        ],
        achievements: [
          'Reduced bundle size by more than 55% (tree shaking, lazy loading, code splitting, dependency analysis): less JavaScript to load, improved FCP, LCP and TBT.',
          "Expanded the UI Kit from 10 to 30 components, reducing the team's development time for new screens by about 40%.",
          'Brought test coverage up to 80% and wrote 30+ e2e scenarios.',
          'Automated code checks before commits and releases.',
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
      'TanStack React Query',
      'TanStack React Router',
      'openapi-fetch',
      'Zustand',
      'Tailwind CSS',
      'HeroUI',
      'Vite',
      'NestJS',
      'PostgreSQL',
    ],
    translations: {
      ru: {
        company: 'Sparkit / BE Happy',
        project: 'Scooter Admin CRM',
        summary:
          'CRM для управления и мониторинга парка электросамокатов: контроль самокатов, пользователей, зон передвижения и операционных процессов. Единственный frontend-разработчик на проекте.',
        responsibilities: [
          'Спроектировал структуру проекта, настроил инженерную инфраструктуру, окружение разработки и стандарты команды, принял ключевые технические решения по стеку.',
          'Реализовал маршрутизацию и ролевой доступ (администратор, оператор, техник) через TanStack React Router.',
          'Интегрировал клиент с backend по OpenAPI через openapi-fetch, настроил кэширование данных через TanStack React Query.',
          'Реализовал таблицы с сортировкой, фильтрацией и пагинацией и интерфейсы мониторинга парка (статус, заряд, геолокация), адаптивная вёрстка на Tailwind CSS и HeroUI.',
        ],
        achievements: [
          'Довёл веб-приложение с нуля до рабочего продукта примерно за 3 месяца.',
          'Мониторинг парка поддерживает более 500 единиц техники.',
          'Заложенные архитектура, dev-окружение и стандарты стали основой, на которой продукт продолжила развивать штатная команда.',
        ],
      },
      en: {
        company: 'Sparkit / BE Happy',
        project: 'Scooter Admin CRM',
        summary:
          'CRM for managing and monitoring an e-scooter fleet: control of scooters, users, riding zones and operational processes. Sole frontend developer on the project.',
        responsibilities: [
          'Designed the project structure, set up the engineering infrastructure, development environment and team standards; made key technical decisions on the stack.',
          'Implemented routing and role-based access (administrator, operator, technician) using TanStack React Router.',
          'Integrated the client with the backend via OpenAPI using openapi-fetch; set up data caching with TanStack React Query.',
          'Built tables with sorting, filtering and pagination, and fleet monitoring interfaces (status, battery level, geolocation); responsive layout with Tailwind CSS and HeroUI.',
        ],
        achievements: [
          'Took the web application from scratch to a working product in about 3 months.',
          'Fleet monitoring supports more than 500 vehicles.',
          'The architecture, dev environment and standards I established became the foundation on which the in-house team continued to develop the product.',
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
      'Axios',
      'Styled Components',
      'Webpack',
      'Docker',
      'WebSocket',
    ],
    translations: {
      ru: {
        company: 'General Soft',
        project: 'Law Portal',
        summary:
          'Платформа сопровождения гражданских, административных и уголовных процессов: ведение дел, отслеживание статусов, работа с финансовыми данными, ролевое управление доступом.',
        responsibilities: [
          'Разрабатывал клиентские и внутренние интерфейсы юридической платформы для более чем шести пользовательских ролей.',
          'Реализовал авторизацию, регистрацию и ролевой доступ (юрист, истец, клиент, свидетель, ответчик).',
          'Реализовал интерактивные дашборды с графиками (Recharts) для финансовых показателей и статусов дел.',
          'Настроил систему уведомлений об изменениях статусов дел через всплывающие окна.',
          'Реализовал внутренний чат приложения на WebSocket.',
        ],
        achievements: [
          'Оптимизировал производительность интерфейсов при работе с большими объёмами данных и финансовыми дашбордами.',
          'Обеспечил обмен сообщениями между участниками процесса в реальном времени.',
        ],
      },
      en: {
        company: 'General Soft',
        project: 'Law Portal',
        summary:
          'A platform supporting civil, administrative and criminal proceedings: case management, status tracking, financial data handling and role-based access control.',
        responsibilities: [
          'Developed client-facing and internal interfaces of the legal platform for more than six user roles.',
          'Implemented authentication, registration and role-based access (lawyer, plaintiff, client, witness, defendant).',
          'Built interactive dashboards with charts (Recharts) for financial metrics and case statuses.',
          'Set up a notification system for case status changes via pop-up windows.',
          'Implemented the in-app chat using WebSocket.',
        ],
        achievements: [
          'Optimized interface performance when working with large data volumes and financial dashboards.',
          'Enabled real-time messaging between case participants.',
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
          'Платформа аренды коммерческих кухонь: интерфейс управления заказами и заявками, валидация форм, интеграция с API платежей и счетов.',
        responsibilities: [],
        achievements: [],
      },
      en: {
        company: null,
        project: 'Kitchen Space',
        summary:
          'A commercial kitchen rental platform: order and request management interface, form validation, integration with payment and invoicing APIs.',
        responsibilities: [],
        achievements: [],
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
        responsibilities: [],
        achievements: [],
      },
      en: {
        company: null,
        project: 'Vezetvsem',
        summary:
          'A freight transportation request platform: request interfaces with filtering, sorting and search, integration with delivery status APIs.',
        responsibilities: [],
        achievements: [],
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

// Группы и состав как в разделе «Ключевые компетенции» резюме. Vitest, Playwright
// и Prisma в резюме нет, но они используются в этом проекте и открытых проектах.
export const skillCategories = [
  {
    slug: 'languages',
    translations: { ru: { name: 'Языки' }, en: { name: 'Languages' } },
    skills: ['TypeScript', 'JavaScript (ES6+ / ES2023)'],
  },
  {
    slug: 'frameworks',
    translations: {
      ru: { name: 'Фреймворки и платформы' },
      en: { name: 'Frameworks and platforms' },
    },
    skills: [
      'React',
      'Next.js',
      'Node.js',
      'NestJS',
      'Express',
      'React Router',
      'TanStack React Router',
      'WordPress',
    ],
  },
  {
    slug: 'state',
    translations: {
      ru: { name: 'Управление состоянием' },
      en: { name: 'State management' },
    },
    skills: [
      'Redux Toolkit',
      'RTK Query',
      'MobX',
      'Zustand',
      'TanStack React Query',
    ],
  },
  {
    slug: 'ui',
    translations: { ru: { name: 'UI' }, en: { name: 'UI' } },
    skills: [
      'Material UI',
      'Ant Design',
      'HeroUI',
      'Tailwind CSS',
      'Styled Components',
      'CSS Modules',
      'SCSS / Sass',
    ],
  },
  {
    slug: 'forms',
    translations: {
      ru: { name: 'Формы и валидация' },
      en: { name: 'Forms and validation' },
    },
    skills: ['React Hook Form', 'Formik', 'Zod'],
  },
  {
    slug: 'testing',
    translations: { ru: { name: 'Тестирование' }, en: { name: 'Testing' } },
    skills: [
      'Jest',
      'React Testing Library',
      'Cypress',
      'Vitest',
      'Playwright',
    ],
  },
  {
    slug: 'architecture',
    translations: {
      ru: { name: 'Архитектура и подходы' },
      en: { name: 'Architecture and approaches' },
    },
    skills: [
      'SPA',
      'SSR',
      'SSG',
      'Microfrontend',
      'Feature-Sliced Design',
      'SOLID',
      'Design patterns',
    ],
  },
  {
    slug: 'databases',
    translations: { ru: { name: 'Базы данных' }, en: { name: 'Databases' } },
    skills: ['PostgreSQL', 'MongoDB', 'Prisma'],
  },
  {
    slug: 'devops',
    translations: {
      ru: { name: 'DevOps и CI/CD' },
      en: { name: 'DevOps and CI/CD' },
    },
    skills: [
      'Git',
      'GitLab',
      'CI/CD',
      'Docker',
      'Nginx',
      'Vite',
      'Webpack',
      'Babel',
    ],
  },
  {
    slug: 'integrations',
    translations: { ru: { name: 'Интеграции' }, en: { name: 'Integrations' } },
    skills: [
      'REST API',
      'OpenAPI',
      'openapi-fetch',
      'Axios',
      'HTTP',
      'JSON',
      'WebSocket',
    ],
  },
  {
    slug: 'tools',
    translations: {
      ru: { name: 'Инструменты' },
      en: { name: 'Tools' },
    },
    skills: [
      'Jira',
      'Confluence',
      'Figma',
      'Chrome DevTools',
      'ESLint',
      'Prettier',
      'Husky',
      'lint-staged',
    ],
  },
];
