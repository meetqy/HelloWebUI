interface Language {
  en?: string;
  zh?: string;
  zh_hk?: string;
  jp?: string;
}

export const useLanguage = (lang: Language, route: any) => {
  const { language } = route.params;

  return lang[(language as string) || "zh"];
};
