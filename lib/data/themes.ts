export interface SubjectOption {
  id: string;
  name: string;
  description: string;
  topicSlug: string;
  questionSetTitle: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  subjects: SubjectOption[];
}

export const THEMES: ThemeOption[] = [
  {
    id: "school-classics",
    name: "Школа и классика",
    description: "Повтори материалы уроков и любимых предметов.",
    subjects: [
      {
        id: "chemistry",
        name: "Химия 7-8 класс",
        description: "Растворы, реакции и базовые опыты.",
        topicSlug: "science",
        questionSetTitle: "Химия 7-8 класс · сет 1"
      },
      {
        id: "chemistry-11",
        name: "Химия 11 класс",
        description: "Органика, физхимия и tricky реакции выпускного курса.",
        topicSlug: "science",
        questionSetTitle: "Химия 11 класс · сет 1"
      },
      {
        id: "literature",
        name: "Литература",
        description: "Классики, театры и медиа.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      },
      {
        id: "geography",
        name: "География",
        description: "Страны, столицы, природные зоны.",
        topicSlug: "nature",
        questionSetTitle: "Природный сет 1"
      }
    ]
  },
  {
    id: "exams",
    name: "Экзамены и тесты",
    description: "Подготовься к контрольным и сертификатам.",
    subjects: [
      {
        id: "traffic-rules",
        name: "ПДД",
        description: "Правила, знаки и безопасность.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      },
      {
        id: "history-basics",
        name: "История",
        description: "Хронология и ключевые события.",
        topicSlug: "history",
        questionSetTitle: "Исторический сет 1"
      },
      {
        id: "civics",
        name: "Обществознание",
        description: "Право, экономика, гражданство.",
        topicSlug: "history",
        questionSetTitle: "Исторический сет 1"
      }
    ]
  },
  {
    id: "tech",
    name: "Технологии и инженерия",
    description: "Гаджеты, код и транспорт будущего.",
    subjects: [
      {
        id: "programming",
        name: "Программирование",
        description: "Языки, концепции, практика.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      },
      {
        id: "gadgets",
        name: "Гаджеты",
        description: "Устройства, интерфейсы, IoT.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      },
      {
        id: "future-transport",
        name: "Транспорт будущего",
        description: "Электромобили и космотехника.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      }
    ]
  },
  {
    id: "science-nature",
    name: "Наука и природа",
    description: "Экосистемы, космос и климат.",
    subjects: [
      {
        id: "astronomy",
        name: "Астрономия",
        description: "Планеты и миссии.",
        topicSlug: "science",
        questionSetTitle: "Научный сет 1"
      },
      {
        id: "biology",
        name: "Биология",
        description: "Человек и экосистемы.",
        topicSlug: "nature",
        questionSetTitle: "Природный сет 1"
      },
      {
        id: "climate",
        name: "Климат и экология",
        description: "Изменение климата и защита природы.",
        topicSlug: "nature",
        questionSetTitle: "Природный сет 1"
      }
    ]
  },
  {
    id: "culture-media",
    name: "Культура и медиа",
    description: "Музыка, кино и современное искусство.",
    subjects: [
      {
        id: "music",
        name: "Музыка и сцена",
        description: "Жанры, артисты, фестивали.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      },
      {
        id: "cinema",
        name: "Кино и сериалы",
        description: "История кино и легендарные тайтлы.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      },
      {
        id: "modern-art",
        name: "Современное искусство",
        description: "Тренды, художники, выставки.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      }
    ]
  },
  {
    id: "sport",
    name: "Спорт и активность",
    description: "Правила, рекорды и здоровье.",
    subjects: [
      {
        id: "olympic",
        name: "Олимпийские виды",
        description: "Правила, легенды и медали.",
        topicSlug: "history",
        questionSetTitle: "Исторический сет 1"
      },
      {
        id: "fitness",
        name: "Фитнес и здоровье",
        description: "Мифы о тренировках и восстановлении.",
        topicSlug: "science",
        questionSetTitle: "Научный сет 1"
      },
      {
        id: "extreme",
        name: "Экстремальные виды",
        description: "Серфинг, альпинизм, дрейф.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      }
    ]
  },
  {
    id: "travel",
    name: "Путешествия и города",
    description: "Архитектура, урбанистика, традиции.",
    subjects: [
      {
        id: "architecture",
        name: "Архитектура",
        description: "Стили и знаковые здания.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      },
      {
        id: "urban",
        name: "Урбанистика",
        description: "Транспорт, комфорт, сценарии.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      },
      {
        id: "traditions",
        name: "Традиции мира",
        description: "Обычаи и праздники стран.",
        topicSlug: "history",
        questionSetTitle: "Исторический сет 1"
      }
    ]
  },
  {
    id: "business",
    name: "Бизнес и финансы",
    description: "Стартапы, деньги и бренды.",
    subjects: [
      {
        id: "startups",
        name: "Стартапы",
        description: "Продукты, инвестиции, масштабирование.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      },
      {
        id: "personal-finance",
        name: "Личные финансы",
        description: "Сбережения, кредиты, бюджет.",
        topicSlug: "history",
        questionSetTitle: "Исторический сет 1"
      },
      {
        id: "marketing",
        name: "Маркетинг и бренды",
        description: "Кампании, слоганы, легенды.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      }
    ]
  },
  {
    id: "health",
    name: "Здоровье и психология",
    description: "Медицина, сон и ментальный баланс.",
    subjects: [
      {
        id: "medical-myths",
        name: "Мифы о медицине",
        description: "Питание, лечение, профилактика.",
        topicSlug: "science",
        questionSetTitle: "Научный сет 1"
      },
      {
        id: "mental",
        name: "Ментальное здоровье",
        description: "Стресс, привычки, восстановление.",
        topicSlug: "nature",
        questionSetTitle: "Природный сет 1"
      },
      {
        id: "sleep",
        name: "Сон и энергия",
        description: "Режим, концентрация, восстановление.",
        topicSlug: "science",
        questionSetTitle: "Научный сет 1"
      }
    ]
  },
  {
    id: "games",
    name: "Игры и развлечения",
    description: "Видеоигры, настолки и поп-культура.",
    subjects: [
      {
        id: "video-games",
        name: "Видеоигры",
        description: "Истории франшиз и разработчиков.",
        topicSlug: "technology",
        questionSetTitle: "Технологический сет 1"
      },
      {
        id: "board-games",
        name: "Настолки и загадки",
        description: "Классика и новинки.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      },
      {
        id: "pop-culture",
        name: "Поп-культура",
        description: "Комиксы, супергерои, фан-клубы.",
        topicSlug: "culture",
        questionSetTitle: "Культурный сет 1"
      }
    ]
  }
];

export function getSubjectById(id?: string | null): {
  theme: ThemeOption;
  subject: SubjectOption;
} | null {
  if (!id) return null;
  for (const theme of THEMES) {
    const subject = theme.subjects.find((item) => item.id === id);
    if (subject) return { theme, subject };
  }
  return null;
}

export function getThemeById(id?: string | null): ThemeOption | null {
  if (!id) return null;
  return THEMES.find((theme) => theme.id === id) ?? null;
}
