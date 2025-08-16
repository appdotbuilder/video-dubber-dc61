import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for PostgreSQL
export const supportedLanguagesEnum = pgEnum('supported_languages', [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
]);

export const translationStatusEnum = pgEnum('translation_status', [
  'pending',
  'processing',
  'completed',
  'failed'
]);

// Translation jobs table
export const translationJobsTable = pgTable('translation_jobs', {
  id: serial('id').primaryKey(),
  original_filename: text('original_filename').notNull(),
  original_file_path: text('original_file_path').notNull(),
  detected_language: supportedLanguagesEnum('detected_language'), // Nullable - will be detected by AI
  target_language: supportedLanguagesEnum('target_language').notNull(),
  status: translationStatusEnum('status').notNull().default('pending'),
  translated_file_path: text('translated_file_path'), // Nullable - populated when translation is complete
  transcript: text('transcript'), // Nullable - original transcript
  translated_transcript: text('translated_transcript'), // Nullable - translated transcript
  error_message: text('error_message'), // Nullable - populated on failure
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type TranslationJob = typeof translationJobsTable.$inferSelect; // For SELECT operations
export type NewTranslationJob = typeof translationJobsTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { 
  translationJobs: translationJobsTable 
};