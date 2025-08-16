import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type UploadVideoInput } from '../schema';
import { uploadVideo } from '../handlers/upload_video';
import { eq } from 'drizzle-orm';
import { readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';

// Test input with base64 encoded dummy video data
const testVideoData = Buffer.from('dummy video content for testing').toString('base64');

const testInput: UploadVideoInput = {
  filename: 'test-video.mp4',
  file_data: testVideoData,
  target_language: 'es'
};

describe('uploadVideo', () => {
  beforeEach(createDB);
  afterEach(async () => {
    // Clean up uploaded files
    if (existsSync('./storage')) {
      await rm('./storage', { recursive: true, force: true });
    }
    await resetDB();
  });

  it('should upload video and create translation job', async () => {
    const result = await uploadVideo(testInput);

    // Verify translation job properties
    expect(result.original_filename).toEqual('test-video.mp4');
    expect(result.target_language).toEqual('es');
    expect(result.status).toEqual('pending');
    expect(result.detected_language).toBeNull();
    expect(result.translated_file_path).toBeNull();
    expect(result.transcript).toBeNull();
    expect(result.translated_transcript).toBeNull();
    expect(result.error_message).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.original_file_path).toMatch(/^\/uploads\/videos\/\d+_[a-z0-9]+_test-video\.mp4$/);
  });

  it('should save video file to filesystem', async () => {
    const result = await uploadVideo(testInput);

    // Verify file was saved
    const savedFilePath = `./storage${result.original_file_path}`;
    expect(existsSync(savedFilePath)).toBe(true);

    // Verify file content
    const savedFileBuffer = await readFile(savedFilePath);
    const originalBuffer = Buffer.from(testVideoData, 'base64');
    expect(savedFileBuffer.equals(originalBuffer)).toBe(true);
  });

  it('should save translation job to database', async () => {
    const result = await uploadVideo(testInput);

    // Query database to verify job was saved
    const jobs = await db.select()
      .from(translationJobsTable)
      .where(eq(translationJobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    const savedJob = jobs[0];
    expect(savedJob.original_filename).toEqual('test-video.mp4');
    expect(savedJob.target_language).toEqual('es');
    expect(savedJob.status).toEqual('pending');
    expect(savedJob.detected_language).toBeNull();
  });

  it('should handle different file types', async () => {
    const aviInput: UploadVideoInput = {
      filename: 'video.avi',
      file_data: Buffer.from('avi video content').toString('base64'),
      target_language: 'fr'
    };

    const result = await uploadVideo(aviInput);

    expect(result.original_filename).toEqual('video.avi');
    expect(result.target_language).toEqual('fr');
    expect(result.original_file_path).toMatch(/^\/uploads\/videos\/\d+_[a-z0-9]+_video\.avi$/);

    // Verify file exists
    const savedFilePath = `./storage${result.original_file_path}`;
    expect(existsSync(savedFilePath)).toBe(true);
  });

  it('should handle different target languages', async () => {
    const languages = ['en', 'de', 'ja', 'zh'] as const;
    
    for (const lang of languages) {
      const input: UploadVideoInput = {
        filename: `test-${lang}.mp4`,
        file_data: Buffer.from(`video for ${lang}`).toString('base64'),
        target_language: lang
      };

      const result = await uploadVideo(input);
      expect(result.target_language).toEqual(lang);
      expect(result.original_filename).toEqual(`test-${lang}.mp4`);
    }
  });

  it('should generate unique file paths for simultaneous uploads', async () => {
    // Create multiple uploads with same filename
    const uploads = Array.from({ length: 3 }, (_, i) => ({
      filename: 'same-name.mp4',
      file_data: Buffer.from(`content ${i}`).toString('base64'),
      target_language: 'en' as const
    }));

    // Upload all files simultaneously
    const results = await Promise.all(uploads.map(uploadVideo));

    // Verify all have unique file paths
    const filePaths = results.map(r => r.original_file_path);
    const uniquePaths = new Set(filePaths);
    expect(uniquePaths.size).toEqual(3);

    // Verify all files exist
    for (const result of results) {
      const savedFilePath = `./storage${result.original_file_path}`;
      expect(existsSync(savedFilePath)).toBe(true);
    }
  });

  it('should handle large base64 data', async () => {
    // Create larger test data (1KB)
    const largeData = Buffer.from('x'.repeat(1024)).toString('base64');
    const largeInput: UploadVideoInput = {
      filename: 'large-video.mp4',
      file_data: largeData,
      target_language: 'pt'
    };

    const result = await uploadVideo(largeInput);

    expect(result.original_filename).toEqual('large-video.mp4');
    
    // Verify large file was saved correctly
    const savedFilePath = `./storage${result.original_file_path}`;
    const savedFileBuffer = await readFile(savedFilePath);
    const originalBuffer = Buffer.from(largeData, 'base64');
    expect(savedFileBuffer.equals(originalBuffer)).toBe(true);
    expect(savedFileBuffer.length).toEqual(1024);
  });
});