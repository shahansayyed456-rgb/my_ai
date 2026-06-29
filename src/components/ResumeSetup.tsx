import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Play } from 'lucide-react';
import { Question } from '../types';

interface ResumeSetupProps {
  onComplete: (data: { text: string; skills: string[]; projects: string[]; questions: Question[] }) => void;
}

export function ResumeSetup({ onComplete }: ResumeSetupProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const uploadRes = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Failed to parse PDF.');

      const { text } = await uploadRes.json();
      
      setIsUploading(false);
      setIsAnalyzing(true);

      const analyzeRes = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text })
      });

      if (!analyzeRes.ok) throw new Error('Failed to analyze resume.');

      const analysisData = await analyzeRes.json();
      
      onComplete({
        text,
        skills: analysisData.skills || [],
        projects: analysisData.projects || [],
        questions: analysisData.questions || []
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during resume processing.');
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6 transition-colors">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/30">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">AI Interview Coach</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
            Upload your resume to get started. I will extract your skills, analyze your projects, and generate a customized mock interview tailored specifically to your experience.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isAnalyzing}
              className="group relative px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              {isUploading || isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              )}
              
              <span>
                {isUploading ? "Reading PDF..." : isAnalyzing ? "Generating Questions..." : "Upload Resume (PDF)"}
              </span>
            </button>
            
            {(isUploading || isAnalyzing) && (
              <p className="text-sm text-slate-500 animate-pulse mt-2">
                This might take a minute...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
