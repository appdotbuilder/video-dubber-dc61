import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type UpdateTranslationJobInput, type TranslationJob } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateTranslationJob(input: UpdateTranslationJobInput): Promise<TranslationJob | null> {
  try {
    // Extract id from input and prepare update data
    const { id, ...updateData } = input;
    
    // Update the translation job with new timestamp
    const result = await db.update(translationJobsTable)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(translationJobsTable.id, id))
      .returning()
      .execute();

    // Return the updated job or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Translation job update failed:', error);
    throw error;
  }
}