import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SupportedLanguage } from '../../../server/src/schema';
import type { LanguageOption } from '../../../server/src/handlers/get_supported_languages';

interface VideoUploadProps {
  languages: LanguageOption[];
  onUpload: (file: File, targetLanguage: SupportedLanguage) => Promise<void>;
  isUploading: boolean;
}

export function VideoUpload({ languages, onUpload, isUploading }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage | ''>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Check file size (max 100MB for demo)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a video file');
      return;
    }

    if (!targetLanguage) {
      alert('Please select a target language');
      return;
    }

    await onUpload(selectedFile, targetLanguage);
    
    // Reset form on successful upload
    setSelectedFile(null);
    setTargetLanguage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <Card 
        className={`transition-all duration-200 ${
          dragOver 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-dashed border-2 border-gray-300 hover:border-purple-300 hover:bg-purple-25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          {selectedFile ? (
            <div className="space-y-4">
              <div className="text-6xl">🎬</div>
              <div>
                <h3 className="font-semibold text-lg">{selectedFile.name}</h3>
                <p className="text-gray-600">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
                {selectedFile.type.startsWith('video/') && (
                  <video
                    src={URL.createObjectURL(selectedFile)}
                    className="mx-auto mt-4 max-w-xs rounded-lg shadow-md"
                    controls
                    preload="metadata"
                    onLoadedMetadata={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                      const video = e.currentTarget;
                      console.log(`Duration: ${formatDuration(video.duration)}`);
                    }}
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUploading}
              >
                Choose Different File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📁</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Drop your video here or click to browse
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports MP4, AVI, MOV, and other video formats • Max 100MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  📂 Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Selection */}
      <div className="space-y-2">
        <label htmlFor="target-language" className="block text-sm font-medium text-gray-700">
          🌍 Target Language
        </label>
        <Select
          value={targetLanguage}
          onValueChange={(value: SupportedLanguage) => setTargetLanguage(value)}
          disabled={isUploading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select the language you want the video translated to..." />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang: LanguageOption) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading and processing...</span>
            <span>Please wait</span>
          </div>
          <Progress value={undefined} className="w-full" />
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        size="lg"
        disabled={!selectedFile || !targetLanguage || isUploading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Processing Video...
          </>
        ) : (
          <>
            🚀 Start Translation
          </>
        )}
      </Button>

      {selectedFile && targetLanguage && !isUploading && (
        <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p>
            Ready to translate <strong>{selectedFile.name}</strong> to{' '}
            <strong>{languages.find((l: LanguageOption) => l.code === targetLanguage)?.name}</strong>
          </p>
        </div>
      )}
    </form>
  );
}