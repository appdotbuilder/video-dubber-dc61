import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type CreateTranslationJobInput, type TranslationJob } from '../schema';

export const createTranslationJob = async (input: CreateTranslationJobInput): Promise<TranslationJob> => {
  try {
    // Insert translation job record
    const result = await db.insert(translationJobsTable)
      .values({
        original_filename: input.original_filename,
        original_file_path: input.original_file_path,
        target_language: input.target_language,
        status: 'pending', // Default status for new jobs
        detected_language: null, // Will be detected during processing
        translated_file_path: null,
        transcript: null,
        translated_transcript: null,
        error_message: null
      })
      .returning()
      .execute();

    const translationJob = result[0];
    return translationJob;
  } catch (error) {
    console.error('Translation job creation failed:', error);
    throw error;
  }
};