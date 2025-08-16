import { type SupportedLanguage } from '../schema';

// Language display names mapping
const languageNames: Record<SupportedLanguage, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi'
};

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
}

export const getSupportedLanguages = async (): Promise<LanguageOption[]> => {
  try {
    // Convert the language mapping to an array of language options
    const languages: LanguageOption[] = Object.entries(languageNames).map(([code, name]) => ({
      code: code as SupportedLanguage,
      name
    }));
    
    // Sort languages alphabetically by name for better UX
    languages.sort((a, b) => a.name.localeCompare(b.name));
    
    return languages;
  } catch (error) {
    console.error('Failed to get supported languages:', error);
    throw error;
  }
};