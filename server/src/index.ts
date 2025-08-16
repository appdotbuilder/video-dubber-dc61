import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  uploadVideoInputSchema,
  createTranslationJobInputSchema,
  updateTranslationJobInputSchema,
  getTranslationJobInputSchema
} from './schema';

// Import handlers
import { uploadVideo } from './handlers/upload_video';
import { createTranslationJob } from './handlers/create_translation_job';
import { getTranslationJob } from './handlers/get_translation_job';
import { getTranslationJobs } from './handlers/get_translation_jobs';
import { updateTranslationJob } from './handlers/update_translation_job';
import { getSupportedLanguages } from './handlers/get_supported_languages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Upload video and create translation job
  uploadVideo: publicProcedure
    .input(uploadVideoInputSchema)
    .mutation(({ input }) => uploadVideo(input)),

  // Create a translation job (for existing videos)
  createTranslationJob: publicProcedure
    .input(createTranslationJobInputSchema)
    .mutation(({ input }) => createTranslationJob(input)),

  // Get a specific translation job by ID
  getTranslationJob: publicProcedure
    .input(getTranslationJobInputSchema)
    .query(({ input }) => getTranslationJob(input)),

  // Get all translation jobs
  getTranslationJobs: publicProcedure
    .query(() => getTranslationJobs()),

  // Update a translation job (used by processing pipeline)
  updateTranslationJob: publicProcedure
    .input(updateTranslationJobInputSchema)
    .mutation(({ input }) => updateTranslationJob(input)),

  // Get supported languages
  getSupportedLanguages: publicProcedure
    .query(() => getSupportedLanguages()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Video Translation API server listening at port: ${port}`);
}

start();