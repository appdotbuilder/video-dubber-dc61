import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type GetTranslationJobInput, type TranslationJob } from '../schema';
import { eq } from 'drizzle-orm';

export const getTranslationJob = async (input: GetTranslationJobInput): Promise<TranslationJob | null> => {
  try {
    // Query the database for a translation job by ID
    const result = await db.select()
      .from(translationJobsTable)
      .where(eq(translationJobsTable.id, input.id))
      .limit(1)
      .execute();

    // Return the job if found, null otherwise
    if (result.length === 0) {
      return null;
    }

    const job = result[0];
    
    // Return the job with proper date conversion
    return {
      ...job,
      created_at: new Date(job.created_at),
      updated_at: new Date(job.updated_at)
    };
  } catch (error) {
    console.error('Translation job retrieval failed:', error);
    throw error;
  }
};