import type { Dictionary } from './ru';

// Тип Dictionary не даст пропустить строку: забытый перевод не скомпилируется
export const en: Dictionary = {
  nav: {
    label: 'Main navigation',
    about: 'About',
    projects: 'Projects',
    skills: 'Skills',
    experience: 'Experience',
    contact: 'Contact',
  },
  social: {
    label: 'Profile links',
  },
  language: {
    label: 'Site language',
  },
  about: {
    greeting: 'Hi, my name is',
    viewResume: 'View resume',
    downloadResume: 'Download',
    downloadResumeLabel: 'Download resume',
    skillsLabel: 'Skills and tools',
  },
  projects: {
    title: 'Projects',
    description:
      'Commercial projects under NDA: no code or screenshots, but with tasks and results.',
    metaDescription:
      'Commercial projects: responsibilities, achievements and tech stack. Freelance.',
    present: 'present',
    responsibilities: 'Responsibilities',
    achievements: 'Results and achievements',
    stack: 'Tech stack',
    freelance: 'Freelance',
  },
  experience: {
    title: 'Experience',
    description:
      'Open-source projects on GitHub: skills you can check in the code.',
    allProjects: 'All repositories on GitHub',
    code: 'Code',
    site: 'Website',
  },
  skills: {
    title: 'Skills',
    description: 'Technologies and tools I work with, grouped by area.',
  },
  contact: {
    title: 'Contact',
    description: 'Use the form or whichever channel suits you best.',
    metaDescription: 'Contact form, email, Telegram, GitHub and LinkedIn.',
    form: {
      name: 'Name',
      email: 'Email',
      message: 'Message',
      honeypot: 'Website',
      submit: 'Send',
      sending: 'Sending...',
      results: {
        sent: 'Message sent. Thank you, I will reply soon!',
        'rate-limited':
          'Too many messages from your address. Please try again later or contact me directly.',
        failed:
          'Could not send the message. Please try again or contact me directly.',
      },
      errors: {
        nameTooShort: 'Enter your name: at least 2 characters',
        nameTooLong: 'Name is too long: 100 characters at most',
        emailTooLong: 'Email address is too long',
        emailInvalid: 'Enter a valid email',
        messageTooShort: 'Write a message: at least 10 characters',
        messageTooLong: 'Message is too long: 5000 characters at most',
      },
    },
  },
  notFound: {
    title: 'Page not found',
    description: 'The address may have changed or contain a typo.',
    home: 'Back to home',
  },
};
