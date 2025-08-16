import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TranslationJob } from '../../../server/src/schema';

interface JobsListProps {
  jobs: TranslationJob[];
  onRefresh: () => void;
  getStatusColor: (status: TranslationJob['status']) => string;
  getProgressValue: (status: TranslationJob['status']) => number;
}

export function JobsList({ jobs, onRefresh, getStatusColor, getProgressValue }: JobsListProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getLanguageName = (code: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    return languageNames[code] || code;
  };

  const getStatusEmoji = (status: TranslationJob['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No translation jobs yet</h3>
        <p className="text-gray-500 mb-6">
          Upload your first video to start translating!
        </p>
        <Button onClick={onRefresh} variant="outline">
          🔄 Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {jobs.length} translation job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {jobs.map((job: TranslationJob) => (
            <Card key={job.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusEmoji(job.status)} {job.original_filename}
                    </CardTitle>
                    <CardDescription>
                      Job #{job.id} • Created {formatDate(job.created_at)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{getProgressValue(job.status)}%</span>
                  </div>
                  <Progress value={getProgressValue(job.status)} className="h-2" />
                </div>

                {/* Language Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Source Language:</span>
                    <p className="font-medium">
                      {job.detected_language ? (
                        `🗣️ ${getLanguageName(job.detected_language)}`
                      ) : (
                        <span className="text-gray-400">🔍 Detecting...</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Target Language:</span>
                    <p className="font-medium">🎯 {getLanguageName(job.target_language)}</p>
                  </div>
                </div>

                {/* Error Message */}
                {job.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      <strong>Error:</strong> {job.error_message}
                    </p>
                  </div>
                )}

                {/* Completion Info */}
                {job.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎉</span>
                      <span className="font-medium text-green-800">Translation completed!</span>
                    </div>
                    
                    {job.translated_file_path && (
                      <div className="space-y-2">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                          📥 Download Translated Video
                        </Button>
                        <p className="text-xs text-green-700 text-center">
                          Your video with dubbed audio is ready
                        </p>
                      </div>
                    )}
                    
                    {job.transcript && (
                      <div className="mt-4">
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700">Original Transcript:</h4>
                          <div className="bg-white p-3 rounded border max-h-20 overflow-y-auto">
                            <p className="text-sm text-gray-600">{job.transcript}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {job.translated_transcript && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Translated Transcript:</h4>
                        <div className="bg-white p-3 rounded border max-h-20 overflow-y-auto">
                          <p className="text-sm text-gray-600">{job.translated_transcript}</p>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          📄 Download Transcript
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing Info */}
                {job.status === 'processing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-blue-800 text-sm">
                        Processing your video... This may take a few minutes.
                      </span>
                    </div>
                  </div>
                )}

                {/* Pending Info */}
                {job.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      📋 Your video is in the queue and will be processed shortly.
                    </p>
                  </div>
                )}

                {/* File Paths (for debugging/development) */}
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">Technical Details</summary>
                  <div className="mt-2 space-y-1 font-mono bg-gray-50 p-2 rounded">
                    <div>Original: {job.original_file_path}</div>
                    {job.translated_file_path && (
                      <div>Translated: {job.translated_file_path}</div>
                    )}
                    <div>Updated: {formatDate(job.updated_at)}</div>
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}