import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { getTranslationJobs } from '../handlers/get_translation_jobs';

describe('getTranslationJobs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no jobs exist', async () => {
    const result = await getTranslationJobs();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all translation jobs', async () => {
    // Create first test translation job
    await db.insert(translationJobsTable)
      .values({
        original_filename: 'test1.mp4',
        original_file_path: '/uploads/test1.mp4',
        target_language: 'es',
        status: 'pending'
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second test translation job
    await db.insert(translationJobsTable)
      .values({
        original_filename: 'test2.mp4',
        original_file_path: '/uploads/test2.mp4',
        target_language: 'fr',
        status: 'completed',
        detected_language: 'en',
        transcript: 'Hello world',
        translated_transcript: 'Bonjour monde',
        translated_file_path: '/uploads/test2_fr.mp4'
      })
      .execute();

    const result = await getTranslationJobs();

    expect(result).toHaveLength(2);
    
    // Verify first job (should be sorted by newest first)
    expect(result[0].original_filename).toEqual('test2.mp4');
    expect(result[0].target_language).toEqual('fr');
    expect(result[0].status).toEqual('completed');
    expect(result[0].detected_language).toEqual('en');
    expect(result[0].transcript).toEqual('Hello world');
    expect(result[0].translated_transcript).toEqual('Bonjour monde');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second job
    expect(result[1].original_filename).toEqual('test1.mp4');
    expect(result[1].target_language).toEqual('es');
    expect(result[1].status).toEqual('pending');
    expect(result[1].detected_language).toBeNull();
    expect(result[1].transcript).toBeNull();
    expect(result[1].translated_transcript).toBeNull();
    expect(result[1].translated_file_path).toBeNull();
  });

  it('should return jobs ordered by creation date (newest first)', async () => {
    // Create jobs with slight delay to ensure different timestamps
    const job1 = await db.insert(translationJobsTable)
      .values({
        original_filename: 'old_job.mp4',
        original_file_path: '/uploads/old_job.mp4',
        target_language: 'es',
        status: 'pending'
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const job2 = await db.insert(translationJobsTable)
      .values({
        original_filename: 'new_job.mp4',
        original_file_path: '/uploads/new_job.mp4',
        target_language: 'fr',
        status: 'processing'
      })
      .returning()
      .execute();

    const result = await getTranslationJobs();

    expect(result).toHaveLength(2);
    
    // Verify newest job comes first
    expect(result[0].original_filename).toEqual('new_job.mp4');
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
    
    // Verify older job comes second
    expect(result[1].original_filename).toEqual('old_job.mp4');
  });

  it('should handle jobs with all possible statuses', async () => {
    // Create jobs with different statuses
    await db.insert(translationJobsTable)
      .values([
        {
          original_filename: 'pending.mp4',
          original_file_path: '/uploads/pending.mp4',
          target_language: 'es',
          status: 'pending'
        },
        {
          original_filename: 'processing.mp4',
          original_file_path: '/uploads/processing.mp4',
          target_language: 'fr',
          status: 'processing',
          detected_language: 'en'
        },
        {
          original_filename: 'completed.mp4',
          original_file_path: '/uploads/completed.mp4',
          target_language: 'de',
          status: 'completed',
          detected_language: 'en',
          translated_file_path: '/uploads/completed_de.mp4'
        },
        {
          original_filename: 'failed.mp4',
          original_file_path: '/uploads/failed.mp4',
          target_language: 'it',
          status: 'failed',
          error_message: 'Processing failed'
        }
      ])
      .execute();

    const result = await getTranslationJobs();

    expect(result).toHaveLength(4);
    
    // Verify all statuses are present
    const statuses = result.map(job => job.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('failed');

    // Verify error message is properly returned for failed job
    const failedJob = result.find(job => job.status === 'failed');
    expect(failedJob).toBeDefined();
    expect(failedJob!.error_message).toEqual('Processing failed');
  });

  it('should handle jobs with all supported languages', async () => {
    // Test with various language combinations
    await db.insert(translationJobsTable)
      .values([
        {
          original_filename: 'chinese.mp4',
          original_file_path: '/uploads/chinese.mp4',
          target_language: 'zh',
          status: 'completed',
          detected_language: 'en'
        },
        {
          original_filename: 'arabic.mp4',
          original_file_path: '/uploads/arabic.mp4',
          target_language: 'ar',
          status: 'pending'
        },
        {
          original_filename: 'japanese.mp4',
          original_file_path: '/uploads/japanese.mp4',
          target_language: 'ja',
          status: 'processing',
          detected_language: 'ko'
        }
      ])
      .execute();

    const result = await getTranslationJobs();

    expect(result).toHaveLength(3);
    
    // Verify language fields are properly returned
    const targetLanguages = result.map(job => job.target_language);
    expect(targetLanguages).toContain('zh');
    expect(targetLanguages).toContain('ar');
    expect(targetLanguages).toContain('ja');

    // Verify detected language handling
    const chineseJob = result.find(job => job.target_language === 'zh');
    expect(chineseJob!.detected_language).toEqual('en');

    const japaneseJob = result.find(job => job.target_language === 'ja');
    expect(japaneseJob!.detected_language).toEqual('ko');

    const arabicJob = result.find(job => job.target_language === 'ar');
    expect(arabicJob!.detected_language).toBeNull();
  });
});