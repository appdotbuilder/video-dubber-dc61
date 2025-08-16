import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type TranslationJob } from '../schema';

export const getTranslationJobs = async (): Promise<TranslationJob[]> => {
  try {
    // Query the database for all translation jobs, ordered by creation date (newest first)
    const jobs = await db.select()
      .from(translationJobsTable)
      .orderBy(desc(translationJobsTable.created_at))
      .execute();

    return jobs;
  } catch (error) {
    console.error('Failed to get translation jobs:', error);
    throw error;
  }
};