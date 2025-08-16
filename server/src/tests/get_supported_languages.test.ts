import { describe, expect, it } from 'bun:test';
import { getSupportedLanguages, type LanguageOption } from '../handlers/get_supported_languages';
import { type SupportedLanguage } from '../schema';

describe('getSupportedLanguages', () => {
  it('should return all supported languages', async () => {
    const result = await getSupportedLanguages();

    // Verify we get an array
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(12); // Should have all 12 supported languages

    // Verify each item has the correct structure
    result.forEach(language => {
      expect(language).toHaveProperty('code');
      expect(language).toHaveProperty('name');
      expect(typeof language.code).toBe('string');
      expect(typeof language.name).toBe('string');
      expect(language.code.length).toBeGreaterThan(0);
      expect(language.name.length).toBeGreaterThan(0);
    });
  });

  it('should include all expected language codes', async () => {
    const result = await getSupportedLanguages();
    const codes = result.map(lang => lang.code);

    const expectedCodes: SupportedLanguage[] = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
    ];

    expectedCodes.forEach(code => {
      expect(codes).toContain(code);
    });
  });

  it('should include correct language names', async () => {
    const result = await getSupportedLanguages();
    
    // Create a map for easy lookup
    const languageMap = new Map(result.map(lang => [lang.code, lang.name]));

    // Verify specific language mappings
    expect(languageMap.get('en')).toBe('English');
    expect(languageMap.get('es')).toBe('Spanish');
    expect(languageMap.get('fr')).toBe('French');
    expect(languageMap.get('de')).toBe('German');
    expect(languageMap.get('it')).toBe('Italian');
    expect(languageMap.get('pt')).toBe('Portuguese');
    expect(languageMap.get('ru')).toBe('Russian');
    expect(languageMap.get('ja')).toBe('Japanese');
    expect(languageMap.get('ko')).toBe('Korean');
    expect(languageMap.get('zh')).toBe('Chinese');
    expect(languageMap.get('ar')).toBe('Arabic');
    expect(languageMap.get('hi')).toBe('Hindi');
  });

  it('should return languages sorted alphabetically by name', async () => {
    const result = await getSupportedLanguages();
    const names = result.map(lang => lang.name);

    // Create a sorted copy to compare against
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sortedNames);
  });

  it('should have unique language codes', async () => {
    const result = await getSupportedLanguages();
    const codes = result.map(lang => lang.code);
    const uniqueCodes = [...new Set(codes)];

    expect(codes.length).toBe(uniqueCodes.length);
  });

  it('should have unique language names', async () => {
    const result = await getSupportedLanguages();
    const names = result.map(lang => lang.name);
    const uniqueNames = [...new Set(names)];

    expect(names.length).toBe(uniqueNames.length);
  });

  it('should return consistent results on multiple calls', async () => {
    const result1 = await getSupportedLanguages();
    const result2 = await getSupportedLanguages();

    expect(result1).toEqual(result2);
  });

  it('should return proper TypeScript types', async () => {
    const result = await getSupportedLanguages();

    // Verify the result matches the expected type structure
    result.forEach((language: LanguageOption) => {
      // This test will fail at compile time if types are wrong
      const code: SupportedLanguage = language.code;
      const name: string = language.name;
      
      expect(typeof code).toBe('string');
      expect(typeof name).toBe('string');
    });
  });
});