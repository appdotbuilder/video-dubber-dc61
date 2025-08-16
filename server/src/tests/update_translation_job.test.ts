import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type UpdateTranslationJobInput, type CreateTranslationJobInput } from '../schema';
import { updateTranslationJob } from '../handlers/update_translation_job';
import { eq } from 'drizzle-orm';

// Helper function to create a test translation job
const createTestJob = async (overrides: Partial<CreateTranslationJobInput> = {}) => {
  const jobData = {
    original_filename: 'test_video.mp4',
    original_file_path: '/uploads/test_video.mp4',
    target_language: 'es' as const,
    ...overrides
  };

  const result = await db.insert(translationJobsTable)
    .values(jobData)
    .returning()
    .execute();

  return result[0];
};

describe('updateTranslationJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update translation job status', async () => {
    // Create a test job
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      status: 'processing'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdJob.id);
    expect(result!.status).toBe('processing');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdJob.updated_at.getTime());
  });

  it('should update detected language', async () => {
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      detected_language: 'en'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.detected_language).toBe('en');
    expect(result!.original_filename).toBe(createdJob.original_filename);
  });

  it('should update transcript data', async () => {
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      transcript: 'Hello, this is the original transcript.',
      translated_transcript: 'Hola, esta es la transcripción original.'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.transcript).toBe('Hello, this is the original transcript.');
    expect(result!.translated_transcript).toBe('Hola, esta es la transcripción original.');
  });

  it('should update file paths', async () => {
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      status: 'completed',
      translated_file_path: '/uploads/translated_video_es.mp4'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('completed');
    expect(result!.translated_file_path).toBe('/uploads/translated_video_es.mp4');
  });

  it('should update error message on failure', async () => {
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      status: 'failed',
      error_message: 'Translation service unavailable'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('failed');
    expect(result!.error_message).toBe('Translation service unavailable');
  });

  it('should update multiple fields simultaneously', async () => {
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      detected_language: 'fr',
      status: 'completed',
      transcript: 'Bonjour le monde',
      translated_transcript: 'Hola mundo',
      translated_file_path: '/uploads/translated_fr_to_es.mp4'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.detected_language).toBe('fr');
    expect(result!.status).toBe('completed');
    expect(result!.transcript).toBe('Bonjour le monde');
    expect(result!.translated_transcript).toBe('Hola mundo');
    expect(result!.translated_file_path).toBe('/uploads/translated_fr_to_es.mp4');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent job', async () => {
    const updateInput: UpdateTranslationJobInput = {
      id: 99999, // Non-existent ID
      status: 'completed'
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const createdJob = await createTestJob();
    
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      status: 'completed',
      translated_file_path: '/uploads/final_translation.mp4'
    };

    await updateTranslationJob(updateInput);

    // Verify changes were saved to database
    const dbJob = await db.select()
      .from(translationJobsTable)
      .where(eq(translationJobsTable.id, createdJob.id))
      .execute();

    expect(dbJob).toHaveLength(1);
    expect(dbJob[0].status).toBe('completed');
    expect(dbJob[0].translated_file_path).toBe('/uploads/final_translation.mp4');
    expect(dbJob[0].updated_at).toBeInstanceOf(Date);
    expect(dbJob[0].updated_at.getTime()).toBeGreaterThan(createdJob.updated_at.getTime());
  });

  it('should handle null values correctly', async () => {
    // First create a job with some data
    const createdJob = await createTestJob();
    await updateTranslationJob({
      id: createdJob.id,
      transcript: 'Some transcript',
      error_message: 'Some error'
    });

    // Now clear those fields with null values
    const updateInput: UpdateTranslationJobInput = {
      id: createdJob.id,
      transcript: null,
      error_message: null
    };

    const result = await updateTranslationJob(updateInput);

    expect(result).not.toBeNull();
    expect(result!.transcript).toBeNull();
    expect(result!.error_message).toBeNull();
    
    // Verify in database
    const dbJob = await db.select()
      .from(translationJobsTable)
      .where(eq(translationJobsTable.id, createdJob.id))
      .execute();

    expect(dbJob[0].transcript).toBeNull();
    expect(dbJob[0].error_message).toBeNull();
  });
});