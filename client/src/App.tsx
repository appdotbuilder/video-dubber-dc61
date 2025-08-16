import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
// Using type-only imports for better TypeScript compliance
import type { TranslationJob, SupportedLanguage } from '../../server/src/schema';
import type { LanguageOption } from '../../server/src/handlers/get_supported_languages';
import { VideoUpload } from '@/components/VideoUpload';
import { JobsList } from '@/components/JobsList';

function App() {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load supported languages
  const loadLanguages = useCallback(async () => {
    try {
      const result = await trpc.getSupportedLanguages.query();
      setLanguages(result);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  }, []);

  // Load translation jobs
  const loadJobs = useCallback(async () => {
    try {
      const result = await trpc.getTranslationJobs.query();
      setJobs(result);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
    loadJobs();
  }, [loadLanguages, loadJobs]);

  // Handle video upload
  const handleVideoUpload = async (file: File, targetLanguage: SupportedLanguage) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove data URL prefix to get just the base64 data
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const response = await trpc.uploadVideo.mutate({
        filename: file.name,
        file_data: base64,
        target_language: targetLanguage
      });

      // Add new job to the list
      setJobs((prev: TranslationJob[]) => [response, ...prev]);
      
      // Start polling for updates (in real app, use WebSocket or Server-Sent Events)
      setTimeout(loadJobs, 2000);
    } catch (error) {
      console.error('Failed to upload video:', error);
      setUploadError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Refresh jobs periodically for demo purposes
  useEffect(() => {
    const interval = setInterval(loadJobs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [loadJobs]);

  const getStatusColor = (status: TranslationJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressValue = (status: TranslationJob['status']) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎬 Video Translation Studio
          </h1>
          <p className="text-gray-600 text-lg">
            Upload your videos and get them dubbed in any language with AI-powered translation
          </p>
        </header>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">📤 Upload Video</TabsTrigger>
            <TabsTrigger value="jobs">📋 Translation Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎥 Upload Video for Translation
                </CardTitle>
                <CardDescription>
                  Select a video file and choose your target language. Our AI will automatically detect the original language and create a dubbed version.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadError && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {uploadError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <VideoUpload
                  languages={languages}
                  onUpload={handleVideoUpload}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Translation Jobs
                  {jobs.length > 0 && (
                    <Badge variant="secondary">{jobs.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Track the progress of your video translations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobsList 
                  jobs={jobs}
                  onRefresh={loadJobs}
                  getStatusColor={getStatusColor}
                  getProgressValue={getProgressValue}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;