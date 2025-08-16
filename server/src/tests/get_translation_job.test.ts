import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type GetTranslationJobInput } from '../schema';
import { getTranslationJob } from '../handlers/get_translation_job';
import { eq } from 'drizzle-orm';

// Test translation job data
const testJobData = {
  original_filename: 'test_video.mp4',
  original_file_path: '/uploads/test_video.mp4',
  target_language: 'es' as const,
  status: 'pending' as const
};

const completeJobData = {
  original_filename: 'complete_video.mp4',
  original_file_path: '/uploads/complete_video.mp4',
  detected_language: 'en' as const,
  target_language: 'fr' as const,
  status: 'completed' as const,
  translated_file_path: '/uploads/complete_video_translated.mp4',
  transcript: 'Hello world, this is a test.',
  translated_transcript: 'Bonjour le monde, c\'est un test.'
};

describe('getTranslationJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when job does not exist', async () => {
    const input: GetTranslationJobInput = { id: 999 };
    
    const result = await getTranslationJob(input);
    
    expect(result).toBeNull();
  });

  it('should return translation job when it exists', async () => {
    // Create a test job
    const insertResult = await db.insert(translationJobsTable)
      .values(testJobData)
      .returning()
      .execute();
    
    const createdJob = insertResult[0];
    const input: GetTranslationJobInput = { id: createdJob.id };
    
    const result = await getTranslationJob(input);
    
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.original_filename).toEqual('test_video.mp4');
    expect(result!.original_file_path).toEqual('/uploads/test_video.mp4');
    expect(result!.detected_language).toBeNull();
    expect(result!.target_language).toEqual('es');
    expect(result!.status).toEqual('pending');
    expect(result!.translated_file_path).toBeNull();
    expect(result!.transcript).toBeNull();
    expect(result!.translated_transcript).toBeNull();
    expect(result!.error_message).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return complete translation job with all fields populated', async () => {
    // Create a complete test job
    const insertResult = await db.insert(translationJobsTable)
      .values(completeJobData)
      .returning()
      .execute();
    
    const createdJob = insertResult[0];
    const input: GetTranslationJobInput = { id: createdJob.id };
    
    const result = await getTranslationJob(input);
    
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.original_filename).toEqual('complete_video.mp4');
    expect(result!.original_file_path).toEqual('/uploads/complete_video.mp4');
    expect(result!.detected_language).toEqual('en');
    expect(result!.target_language).toEqual('fr');
    expect(result!.status).toEqual('completed');
    expect(result!.translated_file_path).toEqual('/uploads/complete_video_translated.mp4');
    expect(result!.transcript).toEqual('Hello world, this is a test.');
    expect(result!.translated_transcript).toEqual('Bonjour le monde, c\'est un test.');
    expect(result!.error_message).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return failed job with error message', async () => {
    const failedJobData = {
      ...testJobData,
      original_filename: 'failed_video.mp4',
      status: 'failed' as const,
      error_message: 'Video processing failed due to unsupported format'
    };

    // Create a failed test job
    const insertResult = await db.insert(translationJobsTable)
      .values(failedJobData)
      .returning()
      .execute();
    
    const createdJob = insertResult[0];
    const input: GetTranslationJobInput = { id: createdJob.id };
    
    const result = await getTranslationJob(input);
    
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJob.id);
    expect(result!.status).toEqual('failed');
    expect(result!.error_message).toEqual('Video processing failed due to unsupported format');
  });

  it('should verify job exists in database after retrieval', async () => {
    // Create a test job
    const insertResult = await db.insert(translationJobsTable)
      .values(testJobData)
      .returning()
      .execute();
    
    const createdJob = insertResult[0];
    const input: GetTranslationJobInput = { id: createdJob.id };
    
    // Get the job through the handler
    const result = await getTranslationJob(input);
    
    // Verify the job still exists in database
    const dbJobs = await db.select()
      .from(translationJobsTable)
      .where(eq(translationJobsTable.id, createdJob.id))
      .execute();
    
    expect(dbJobs).toHaveLength(1);
    expect(dbJobs[0].id).toEqual(result!.id);
    expect(dbJobs[0].original_filename).toEqual(result!.original_filename);
    expect(dbJobs[0].status).toEqual(result!.status);
  });

  it('should handle different job statuses correctly', async () => {
    const statuses = ['pending', 'processing', 'completed', 'failed'] as const;
    
    for (const status of statuses) {
      const jobData = {
        ...testJobData,
        original_filename: `${status}_video.mp4`,
        status
      };

      const insertResult = await db.insert(translationJobsTable)
        .values(jobData)
        .returning()
        .execute();
      
      const createdJob = insertResult[0];
      const input: GetTranslationJobInput = { id: createdJob.id };
      
      const result = await getTranslationJob(input);
      
      expect(result).toBeDefined();
      expect(result!.status).toEqual(status);
      expect(result!.original_filename).toEqual(`${status}_video.mp4`);
    }
  });
});