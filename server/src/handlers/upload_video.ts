import { db } from '../db';
import { translationJobsTable } from '../db/schema';
import { type UploadVideoInput, type TranslationJob } from '../schema';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export const uploadVideo = async (input: UploadVideoInput): Promise<TranslationJob> => {
  try {
    // 1. Generate unique file path with timestamp + random component
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filePath = `/uploads/videos/${timestamp}_${randomId}_${input.filename}`;
    const fullPath = `./storage${filePath}`;

    // 2. Ensure upload directory exists
    await mkdir(dirname(fullPath), { recursive: true });

    // 3. Save the uploaded video file to storage
    // Decode base64 file data and save to filesystem
    const fileBuffer = Buffer.from(input.file_data, 'base64');
    await writeFile(fullPath, fileBuffer);

    // 4. Create a new translation job record in the database
    const result = await db.insert(translationJobsTable)
      .values({
        original_filename: input.filename,
        original_file_path: filePath,
        target_language: input.target_language,
        status: 'pending'
      })
      .returning()
      .execute();

    // Return the created translation job
    return result[0];
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
};