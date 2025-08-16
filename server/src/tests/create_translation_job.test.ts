import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type CreateTranslationJobInput } from '../schema';
import { createTranslationJob } from '../handlers/create_translation_job';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTranslationJobInput = {
  original_filename: 'test_video.mp4',
  original_file_path: '/uploads/test_video.mp4',
  target_language: 'es'
};

describe('createTranslationJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a translation job with pending status', async () => {
    const result = await createTranslationJob(testInput);

    // Validate all required fields
    expect(result.original_filename).toEqual('test_video.mp4');
    expect(result.original_file_path).toEqual('/uploads/test_video.mp4');
    expect(result.target_language).toEqual('es');
    expect(result.status).toEqual('pending');
    
    // Validate nullable fields are properly set
    expect(result.detected_language).toBeNull();
    expect(result.translated_file_path).toBeNull();
    expect(result.transcript).toBeNull();
    expect(result.translated_transcript).toBeNull();
    expect(result.error_message).toBeNull();
    
    // Validate auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save translation job to database', async () => {
    const result = await createTranslationJob(testInput);

    // Query the database to verify the job was saved
    const jobs = await db.select()
      .from(translationJobsTable)
      .where(eq(translationJobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    const savedJob = jobs[0];
    
    expect(savedJob.original_filename).toEqual('test_video.mp4');
    expect(savedJob.original_file_path).toEqual('/uploads/test_video.mp4');
    expect(savedJob.target_language).toEqual('es');
    expect(savedJob.status).toEqual('pending');
    expect(savedJob.detected_language).toBeNull();
    expect(savedJob.created_at).toBeInstanceOf(Date);
    expect(savedJob.updated_at).toBeInstanceOf(Date);
  });

  it('should create jobs with different target languages', async () => {
    const inputs = [
      { ...testInput, target_language: 'fr' as const, original_filename: 'french_video.mp4' },
      { ...testInput, target_language: 'de' as const, original_filename: 'german_video.mp4' },
      { ...testInput, target_language: 'ja' as const, original_filename: 'japanese_video.mp4' }
    ];

    const results = await Promise.all(
      inputs.map(input => createTranslationJob(input))
    );

    expect(results).toHaveLength(3);
    expect(results[0].target_language).toEqual('fr');
    expect(results[0].original_filename).toEqual('french_video.mp4');
    expect(results[1].target_language).toEqual('de');
    expect(results[1].original_filename).toEqual('german_video.mp4');
    expect(results[2].target_language).toEqual('ja');
    expect(results[2].original_filename).toEqual('japanese_video.mp4');

    // Verify all jobs were saved to database
    const allJobs = await db.select()
      .from(translationJobsTable)
      .execute();

    expect(allJobs).toHaveLength(3);
  });

  it('should handle various file types and paths', async () => {
    const testCases = [
      {
        original_filename: 'presentation.mov',
        original_file_path: '/tmp/uploads/presentation.mov',
        target_language: 'zh' as const
      },
      {
        original_filename: 'meeting_recording.avi',
        original_file_path: '/storage/videos/meeting_recording.avi',
        target_language: 'ar' as const
      },
      {
        original_filename: 'tutorial.webm',
        original_file_path: '/var/uploads/tutorial.webm',
        target_language: 'hi' as const
      }
    ];

    for (const testCase of testCases) {
      const result = await createTranslationJob(testCase);
      
      expect(result.original_filename).toEqual(testCase.original_filename);
      expect(result.original_file_path).toEqual(testCase.original_file_path);
      expect(result.target_language).toEqual(testCase.target_language);
      expect(result.status).toEqual('pending');
    }
  });

  it('should create jobs with proper timestamp ordering', async () => {
    // Create multiple jobs with small delays to test timestamp ordering
    const firstJob = await createTranslationJob({
      ...testInput,
      original_filename: 'first.mp4'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondJob = await createTranslationJob({
      ...testInput,
      original_filename: 'second.mp4'
    });

    expect(firstJob.created_at.getTime()).toBeLessThanOrEqual(secondJob.created_at.getTime());
    expect(firstJob.updated_at.getTime()).toBeLessThanOrEqual(secondJob.updated_at.getTime());
    
    // Both should have same created_at and updated_at for new jobs
    expect(firstJob.created_at.getTime()).toEqual(firstJob.updated_at.getTime());
    expect(secondJob.created_at.getTime()).toEqual(secondJob.updated_at.getTime());
  });
});