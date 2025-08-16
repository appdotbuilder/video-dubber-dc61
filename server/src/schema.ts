import { z } from 'zod';

// Supported languages enum
export const supportedLanguagesSchema = z.enum([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
]);

export type SupportedLanguage = z.infer<typeof supportedLanguagesSchema>;

// Translation job status enum
export const translationStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed'
]);

export type TranslationStatus = z.infer<typeof translationStatusSchema>;

// Translation job schema
export const translationJobSchema = z.object({
  id: z.number(),
  original_filename: z.string(),
  original_file_path: z.string(),
  detected_language: supportedLanguagesSchema.nullable(),
  target_language: supportedLanguagesSchema,
  status: translationStatusSchema,
  translated_file_path: z.string().nullable(),
  transcript: z.string().nullable(),
  translated_transcript: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TranslationJob = z.infer<typeof translationJobSchema>;

// Input schema for creating a translation job
export const createTranslationJobInputSchema = z.object({
  original_filename: z.string().min(1, "Filename is required"),
  original_file_path: z.string().min(1, "File path is required"),
  target_language: supportedLanguagesSchema
});

export type CreateTranslationJobInput = z.infer<typeof createTranslationJobInputSchema>;

// Input schema for updating translation job
export const updateTranslationJobInputSchema = z.object({
  id: z.number(),
  detected_language: supportedLanguagesSchema.optional(),
  status: translationStatusSchema.optional(),
  translated_file_path: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  translated_transcript: z.string().nullable().optional(),
  error_message: z.string().nullable().optional()
});

export type UpdateTranslationJobInput = z.infer<typeof updateTranslationJobInputSchema>;

// Input schema for getting translation job by ID
export const getTranslationJobInputSchema = z.object({
  id: z.number()
});

export type GetTranslationJobInput = z.infer<typeof getTranslationJobInputSchema>;

// File upload input schema
export const uploadVideoInputSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  file_data: z.string(), // Base64 encoded file data
  target_language: supportedLanguagesSchema
});

export type UploadVideoInput = z.infer<typeof uploadVideoInputSchema>;