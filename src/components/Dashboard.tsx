import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { UserProgress } from '../types';
import { Target, TrendingUp, Award, AlertCircle, Calendar, CheckCircle } from 'lucide-react';

interface DashboardProps {
  progress: UserProgress;
}

export function Dashboard({ progress }: DashboardProps) {
  const radarData = [
    { subject: 'Technical', A: progress.readinessScores.technical, fullMark: 100 },
    { subject: 'HR', A: progress.readinessScores.hr, fullMark: 100 },
    { subject: 'Linux', A: progress.readinessScores.linux, fullMark: 100 },
    { subject: 'AWS', A: progress.readinessScores.aws, fullMark: 100 },
    { subject: 'DevOps', A: progress.readinessScores.devops, fullMark: 100 },
    { subject: 'Projects', A: progress.readinessScores.project, fullMark: 100 },
    { subject: 'Resume', A: progress.readinessScores.resume, fullMark: 100 },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-full dark:bg-slate-900 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Track your interview readiness based on your resume.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Learning Streak</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{progress.learningStreak} Days 🔥</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Overall Readiness</h3>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{progress.overallProgress}%</span>
            <span className="text-sm text-green-500 font-medium mb-1">+5% this week</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Mastered Questions</h3>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{progress.masteredCount}</span>
            <span className="text-sm text-slate-500 font-medium mb-1">/ 800+</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Need Practice</h3>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{progress.needPracticeCount}</span>
            <span className="text-sm text-slate-500 font-medium mb-1">questions</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-1">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-6">Readiness Analysis</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Radar name="Readiness" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col lg:col-span-1">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-6">Strengths & Focus Areas</h3>
          
          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                Strong Areas <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{progress.strongAreas.length}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {progress.strongAreas.map(area => (
                  <span key={area} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-lg text-sm font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-2">
                Focus Areas <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{progress.weakAreas.length}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {progress.weakAreas.map(area => (
                  <span key={area} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800 rounded-lg text-sm font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Revision Calendar</h3>
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Today's Schedule</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {progress.weakAreas.length > 0 && progress.weakAreas[0] !== 'More data needed' ? (
                progress.weakAreas.map((topic, i) => (
                  <div key={topic} className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{topic}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Spaced repetition: Due for review based on low confidence score.</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">You're all caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">Rate more questions with low confidence to populate your revision schedule.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
