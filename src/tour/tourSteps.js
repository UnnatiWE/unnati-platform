// =======================================================
// UNNATI TOUR STEPS DEFINITION
// 9 Steps guiding users through UNNATI platform features
// =======================================================

export const TOUR_STEPS = [
  {
    id: "welcome",
    stepNumber: 1,
    icon: "🌸",
    titleKey: "tourStep1Title",
    descKey: "tourStep1Desc",
    target: '[data-tour="hero-welcome"]',
    fallbackTarget: ".hero",
    page: "home",
    position: "bottom"
  },
  {
    id: "dashboard",
    stepNumber: 2,
    icon: "🏠",
    titleKey: "tourStep2Title",
    descKey: "tourStep2Desc",
    target: '[data-tour="header-dashboard"]',
    fallbackTarget: ".header-right",
    position: "bottom"
  },
  {
    id: "schemes",
    stepNumber: 3,
    icon: "🏛️",
    titleKey: "tourStep3Title",
    descKey: "tourStep3Desc",
    target: '[data-tour="nav-schemes"]',
    fallbackTarget: ".main-nav",
    position: "bottom"
  },
  {
    id: "skills",
    stepNumber: 4,
    icon: "📚",
    titleKey: "tourStep4Title",
    descKey: "tourStep4Desc",
    target: '[data-tour="nav-skills"]',
    fallbackTarget: ".main-nav",
    position: "bottom"
  },
  {
    id: "shg",
    stepNumber: 5,
    icon: "🤝",
    titleKey: "tourStep5Title",
    descKey: "tourStep5Desc",
    target: '[data-tour="nav-shg"]',
    fallbackTarget: ".main-nav",
    position: "bottom"
  },
  {
    id: "help",
    stepNumber: 6,
    icon: "🆘",
    titleKey: "tourStep6Title",
    descKey: "tourStep6Desc",
    target: '[data-tour="nav-help"]',
    fallbackTarget: ".main-nav",
    position: "bottom"
  },
  {
    id: "saved",
    stepNumber: 7,
    icon: "🔖",
    titleKey: "tourStep7Title",
    descKey: "tourStep7Desc",
    target: '[data-tour="saved-card"]',
    fallbackTarget: ".dashboard-grid",
    page: "dashboard",
    position: "top"
  },
  {
    id: "language",
    stepNumber: 8,
    icon: "🌐",
    titleKey: "tourStep8Title",
    descKey: "tourStep8Desc",
    target: ".language-selector",
    position: "bottom"
  },
  {
    id: "guide",
    stepNumber: 9,
    icon: "❓",
    titleKey: "tourStep9Title",
    descKey: "tourStep9Desc",
    target: '[data-tour="guide-btn"]',
    fallbackTarget: ".header-right",
    position: "bottom"
  }
];
