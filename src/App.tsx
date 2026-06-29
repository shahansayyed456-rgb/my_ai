import React, { useState, useEffect, useMemo } from 'react';
import { Category, UserProgress, Question } from './types';
import { Dashboard } from './components/Dashboard';
import { MockInterview } from './components/MockInterview';
import { RichTextEditor } from './components/RichTextEditor';
import { ResumeSetup } from './components/ResumeSetup';
import { interviewQuestions as initialFallbackQuestions } from './data';
import { 
  Terminal, Cloud, Network, Settings, Database, Briefcase, 
  Menu, X, Search, Download, Play, RotateCcw, Check, X as XIcon, 
  BookOpen, Moon, Sun, LayoutDashboard, MessageSquare, ListTodo,
  TrendingUp, Activity, User, FileText, ChevronUp, ChevronDown, Circle, CheckCircle2,
  Volume2, Square, Folder
} from 'lucide-react';
import jsPDF from 'jspdf';
import clsx from 'clsx';

type AppMode = 'setup' | 'dashboard' | 'mock-interview' | 'study-list' | 'quiz';

export default function App() {
  const [hasSetup, setHasSetup] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [mode, setMode] = useState<AppMode>('setup');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, incorrect: 0 });
  
  // Progress State
  const [progress, setProgress] = useState<UserProgress>({
    overallProgress: 0,
    readinessScores: {
      technical: 65,
      hr: 40,
      linux: 70,
      aws: 50,
      devops: 60,
      project: 80,
      resume: 90
    },
    weakAreas: ['Pending Data'],
    strongAreas: ['Pending Data'],
    learningStreak: 0,
    masteredCount: 0,
    needPracticeCount: 0
  });

  useEffect(() => {
    const savedSetup = localStorage.getItem('hasSetup');
    if (savedSetup === 'true') {
      const text = localStorage.getItem('resumeText') || '';
      const qs = JSON.parse(localStorage.getItem('generatedQuestions') || '[]');
      if (text && qs.length > 0) {
        setResumeText(text);
        setQuestions(qs);
        setHasSetup(true);
        setMode('dashboard');
        
        // Dynamically set first category if available
        const categories = Array.from(new Set(qs.map((q: Question) => q.category)));
        if (categories.length > 0) setActiveCategory(categories[0] as string);
      }
    }
  }, []);

  const handleSetupComplete = (data: { text: string; skills: string[]; projects: string[]; questions: Question[] }) => {
    setResumeText(data.text);
    setQuestions(data.questions);
    setHasSetup(true);
    setMode('dashboard');
    
    localStorage.setItem('hasSetup', 'true');
    localStorage.setItem('resumeText', data.text);
    localStorage.setItem('generatedQuestions', JSON.stringify(data.questions));
    
    const categories = Array.from(new Set(data.questions.map((q: Question) => q.category)));
    if (categories.length > 0) setActiveCategory(categories[0] as string);
  };

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(questions.map(q => q.category)));
    return cats.map(cat => ({
      label: cat,
      icon: <Folder className="w-5 h-5" />
    }));
  }, [questions]);

  // Init Theme and Progress
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const recalculateAreas = (scores: Record<string, number>) => {
    const categoryScores: Record<string, { total: number, count: number }> = {};
    
    Object.entries(scores).forEach(([id, score]) => {
      const question = questions.find(q => q.id === id);
      if (question) {
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = { total: 0, count: 0 };
        }
        categoryScores[question.category].total += score;
        categoryScores[question.category].count += 1;
      }
    });

    const weak: string[] = [];
    const strong: string[] = [];

    Object.entries(categoryScores).forEach(([category, data]) => {
      const avg = data.total / data.count;
      if (avg >= 4) {
        strong.push(category);
      } else if (avg <= 2.5) {
        weak.push(category);
      }
    });

    setProgress(p => ({
      ...p,
      weakAreas: weak.length > 0 ? weak : ['More data needed'],
      strongAreas: strong.length > 0 ? strong : ['More data needed']
    }));
  };

  const updateConfidence = (id: string, score: number) => {
    setConfidenceScores(prev => {
      const next = { ...prev, [id]: score };
      localStorage.setItem('confidenceScores', JSON.stringify(next));
      recalculateAreas(next);
      return next;
    });
  };

  const saveNote = (id: string, note: string) => {
    setUserNotes(prev => {
      const next = { ...prev, [id]: note };
      localStorage.setItem('userNotes', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const savedConfidence = localStorage.getItem('confidenceScores');
    if (savedConfidence) {
      const parsed = JSON.parse(savedConfidence);
      setConfidenceScores(parsed);
      recalculateAreas(parsed);
    }

    const savedNotes = localStorage.getItem('userNotes');
    if (savedNotes) {
      setUserNotes(JSON.parse(savedNotes));
    }
  }, [questions]);

  // Clean up speech synthesis when component unmounts or mode/question changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    setPlayingId(null);
  }, [mode, currentQuizIndex, activeCategory]);

  const toggleSpeak = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
      setPlayingId(id);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('learnedQuestions');
    if (saved && questions.length > 0) {
      const savedSet = new Set<string>(JSON.parse(saved));
      setLearned(savedSet);
      setProgress(p => ({
        ...p,
        masteredCount: savedSet.size,
        overallProgress: Math.round((savedSet.size / questions.length) * 100) || 0
      }));
    }
  }, [questions]);

  const toggleLearned = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLearned(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('learnedQuestions', JSON.stringify(Array.from(next)));
      setProgress(p => ({
        ...p,
        masteredCount: next.size,
        overallProgress: Math.round((next.size / questions.length) * 100) || 0
      }));
      return next;
    });
  };

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = q.category === activeCategory;
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (diff: string) => {
    switch(diff?.toLowerCase()) {
      case 'beginner': 
      case 'basic': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const startQuiz = (category: Category | 'ALL') => {
    let pool = category === 'ALL' ? questions : questions.filter(q => q.category === category);
    
    // Shuffle the array using Fisher-Yates
    let shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setQuizQuestions(shuffled);
    setCurrentQuizIndex(0);
    setShowQuizAnswer(false);
    setQuizScore({ correct: 0, incorrect: 0 });
    setMode('quiz');
    setIsSidebarOpen(false);
  };

  const handleQuizAnswer = (knewIt: boolean) => {
    const currentQ = quizQuestions[currentQuizIndex];
    
    if (knewIt) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setLearned(prev => {
        const next = new Set(prev);
        next.add(currentQ.id);
        localStorage.setItem('learnedQuestions', JSON.stringify(Array.from(next)));
        return next;
      });
    } else {
      setQuizScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setShowQuizAnswer(false);
    } else {
      setShowQuizAnswer(true); 
    }
  };

  const exportPDF = (exportAll: boolean = false) => {
    const doc = new jsPDF();
    const questionsToExport = exportAll ? questions : filteredQuestions;
    const title = exportAll ? 'All Resume Interview Questions' : `Interview Questions: ${activeCategory}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Total Questions: ${questionsToExport.length}`, 14, 30);
    
    let y = 40;
    
    questionsToExport.forEach((q, index) => {
      if (y > 270) { doc.addPage(); y = 20; }
      
      if (exportAll) {
        if (index === 0 || q.category !== questionsToExport[index - 1].category) {
          doc.setFontSize(14);
          doc.setTextColor(0, 102, 204);
          doc.setFont('helvetica', 'bold');
          if (y > 250) { doc.addPage(); y = 20; }
          doc.text(`--- ${q.category} ---`, 14, y);
          y += 10;
        }
      }

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      
      const questionText = `Q${index + 1}: ${q.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 180);
      if (y + (splitQuestion.length * 6) > 280) { doc.addPage(); y = 20; }
      doc.text(splitQuestion, 14, y);
      y += (splitQuestion.length * 6) + 2;
      
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.setFont('helvetica', 'normal');
      
      const splitAnswer = doc.splitTextToSize(q.answer, 180);
      if (y + (splitAnswer.length * 5) > 280) { doc.addPage(); y = 20; }
      doc.text(splitAnswer, 14, y);
      y += (splitAnswer.length * 5) + 10;
    });
    
    const filename = exportAll ? 'All_Resume_Questions.pdf' : `${activeCategory.replace(/\s+/g, '_')}_Questions.pdf`;
    doc.save(filename);
  };

  const renderQuizMode = () => {
    if (quizQuestions.length === 0) return null;
    const currentQ = quizQuestions[currentQuizIndex];
    const isFinished = currentQuizIndex === quizQuestions.length - 1 && showQuizAnswer;

    if (isFinished) {
      return (
        <div className="max-w-2xl mx-auto mt-12 text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Quiz Complete! 🎉</h2>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Correct</p>
              <p className="text-4xl font-bold text-green-500">{quizScore.correct}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Incorrect</p>
              <p className="text-4xl font-bold text-red-500">{quizScore.incorrect}</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            You scored {Math.round((quizScore.correct / quizQuestions.length) * 100)}% on this session.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => startQuiz(activeCategory)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Retake Quiz
            </button>
            <button 
              onClick={() => setMode('study-list')}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" /> Back to Study List
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => setMode('study-list')}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            ← Back to List
          </button>
          <div className="text-sm font-medium text-slate-500">
            Question {currentQuizIndex + 1} of {quizQuestions.length}
          </div>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-8">
          <div 
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuizIndex) / quizQuestions.length) * 100}%` }}
          ></div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-10 min-h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentQ.category}</span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyColor(currentQ.difficulty)}`}>
              {currentQ.difficulty}
            </span>
          </div>
          
          <div className="flex justify-between items-start gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white leading-tight">
              {currentQ.question}
            </h2>
            <button
              onClick={(e) => toggleSpeak(e, `quiz-${currentQ.id}`, showQuizAnswer ? `${currentQ.question}. Answer: ${currentQ.answer}` : currentQ.question)}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors shrink-0"
              title={playingId === `quiz-${currentQ.id}` ? "Stop Reading" : "Read Aloud"}
            >
              {playingId === `quiz-${currentQ.id}` ? <Square className="w-6 h-6 fill-current" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

          <div className="mt-auto">
            {!showQuizAnswer ? (
              <button 
                onClick={() => setShowQuizAnswer(true)}
                className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                Show Answer
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">
                  {currentQ.answer}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                  <p className="text-center text-sm font-medium text-slate-500 mb-4">Did you get it right?</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleQuizAnswer(false)}
                      className="flex-1 py-3 px-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2 border border-red-100 dark:border-red-800/50"
                    >
                      <XIcon className="w-5 h-5" /> No, needs practice
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer(true)}
                      className="flex-1 py-3 px-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2 border border-green-100 dark:border-green-800/50"
                    >
                      <Check className="w-5 h-5" /> Yes, I knew it
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(mode) {
      case 'dashboard':
        return <Dashboard progress={progress} />;
      case 'mock-interview':
        return <MockInterview resumeText={resumeText} />;
      case 'quiz':
        return (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors">
            {renderQuizMode()}
          </div>
        );
      case 'study-list':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 transition-colors">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{activeCategory}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{filteredQuestions.length} questions to master</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-full w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                
                <button 
                  onClick={() => startQuiz(activeCategory)}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                  title={`Start a quiz on ${activeCategory}`}
                >
                  <Play className="w-4 h-4" />
                  Quiz Category
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => exportPDF(false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-4xl mx-auto space-y-4">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No questions found matching your criteria.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q, index) => {
                    const isExpanded = expandedId === q.id;
                    const isLearned = learned.has(q.id);

                    return (
                      <div 
                        key={q.id} 
                        className={clsx(
                          "bg-white dark:bg-slate-800 rounded-xl border transition-all duration-200 shadow-sm",
                          isExpanded ? "border-indigo-300 ring-1 ring-indigo-100 dark:border-indigo-600 dark:ring-indigo-900" : "border-slate-200 dark:border-slate-700 hover:border-indigo-200"
                        )}
                      >
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : q.id)}
                          className="w-full px-6 py-4 flex items-start sm:items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-start sm:items-center gap-4 flex-1">
                            <div onClick={(e) => toggleLearned(e, q.id)} className="mt-1 sm:mt-0 shrink-0 text-slate-400 hover:text-green-500 transition-colors cursor-pointer" title="Mark as Mastered">
                              {isLearned ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Q{index + 1}</span>
                                <span className={clsx("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", getDifficultyColor(q.difficulty))}>
                                  {q.difficulty}
                                </span>
                                {isLearned && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                    MASTERED
                                  </span>
                                )}
                              </div>
                              <h3 className={clsx("font-medium", isLearned ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-white")}>{q.question}</h3>
                            </div>
                          </div>
                          <div className="shrink-0 text-slate-400 ml-4 mt-1 sm:mt-0">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-6 pb-5 pt-2">
                            <div className="pl-10">
                              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 relative group">
                                <div className="absolute top-4 right-4">
                                  <button
                                    onClick={(e) => toggleSpeak(e, `list-${q.id}`, `${q.question}. Answer: ${q.answer}`)}
                                    className={clsx(
                                      "p-2 rounded-lg transition-colors shadow-sm",
                                      playingId === `list-${q.id}` 
                                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" 
                                        : "bg-white text-slate-400 hover:text-indigo-600 dark:bg-slate-800 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    )}
                                    title={playingId === `list-${q.id}` ? "Stop Reading" : "Read Aloud"}
                                  >
                                    {playingId === `list-${q.id}` ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                                  </button>
                                </div>
                                <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap pr-12">
                                  {q.answer}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence Level</span>
                                  <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map(score => (
                                      <button
                                        key={score}
                                        onClick={() => updateConfidence(q.id, score)}
                                        className={clsx(
                                          "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors border",
                                          confidenceScores[q.id] === score 
                                            ? score <= 2 ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800"
                                            : score === 3 ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800"
                                            : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800"
                                            : "bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-indigo-500"
                                        )}
                                        title={`Rate confidence: ${score}/5`}
                                      >
                                        {score}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <RichTextEditor 
                                  id={q.id}
                                  initialValue={userNotes[q.id] || ''}
                                  onSave={(note) => saveNote(q.id, note)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard progress={progress} />;
    }
  };

  if (!hasSetup) {
    return (
      <div className={clsx("min-h-screen bg-slate-50 dark:bg-slate-900", isDarkMode && "dark")}>
        <ResumeSetup onComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed md:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 flex flex-col shadow-2xl md:shadow-none shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">PrepAI</h1>
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Premium Edition</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          
          {/* Main Navigation */}
          <div className="space-y-1">
            <button 
              onClick={() => { setMode('dashboard'); setIsSidebarOpen(false); }}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                mode === 'dashboard' ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <LayoutDashboard className="w-5 h-5" /> Overview Dashboard
            </button>
            <button 
              onClick={() => { setMode('mock-interview'); setIsSidebarOpen(false); }}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium relative group",
                mode === 'mock-interview' ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <MessageSquare className="w-5 h-5" /> AI Mock Interview
              {mode !== 'mock-interview' && <span className="absolute right-4 w-2 h-2 rounded-full bg-indigo-500 group-hover:animate-ping"></span>}
            </button>
          </div>

          {/* Categories */}
          <div>
            <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Study Topics</h3>
            <div className="space-y-1">
              {dynamicCategories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => { 
                    setActiveCategory(cat.label);
                    setMode('study-list'); 
                    setIsSidebarOpen(false); 
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                    mode === 'study-list' && activeCategory === cat.label
                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-medium"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <span className={mode === 'study-list' && activeCategory === cat.label ? 'text-indigo-500' : 'opacity-50'}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 transition-colors relative">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">PrepAI</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>

      </main>
    </div>
  );
}
