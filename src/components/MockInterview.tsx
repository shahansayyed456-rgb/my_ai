import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, AlertTriangle, CheckCircle, ChevronRight, Award, Loader2, Mic, MicOff } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'system' | 'interviewer' | 'candidate';
  content: string;
  evaluation?: Evaluation;
}

interface Evaluation {
  score: number;
  mistakes: string[];
  idealAnswer: string;
}

export function MockInterview({ resumeText }: { resumeText: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    startInterview();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startInterview = async () => {
    setIsTyping(true);
    setMessages([{ id: 'sys', role: 'system', content: 'Starting mock interview session based on your resume...' }]);
    try {
      const res = await fetch('/api/start-interview', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      
      setCurrentQuestion(data.nextQuestion);
      setMessages([
        { id: '1', role: 'interviewer', content: data.nextQuestion }
      ]);
    } catch (error) {
      console.error(error);
      setMessages([{ id: 'err', role: 'system', content: 'Failed to connect to AI Interviewer. Please check your connection or API key.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userAnswer = input.trim();
    setInput('');
    
    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'candidate', content: userAnswer }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion,
          userAnswer,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
          resumeText
        })
      });

      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      // Update the user message with the evaluation
      setMessages(prev => prev.map(m => 
        m.id === userMsgId ? { ...m, evaluation: { score: data.score, mistakes: data.mistakes, idealAnswer: data.idealAnswer } } : m
      ));

      // Add the next question
      setCurrentQuestion(data.nextQuestion);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'q', role: 'interviewer', content: data.nextQuestion }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: 'Error evaluating answer.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCoachHelp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isTyping || !currentQuestion) return;

    setIsTyping(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: 'Coach is typing a suggestion...' }]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion,
          userDraft: input,
          resumeText
        })
      });

      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); // remove typing message
        newMsgs.push({ id: Date.now().toString(), role: 'system', content: `💡 Coach Suggestion: ${data.suggestion}` });
        return newMsgs;
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        newMsgs.push({ id: Date.now().toString(), role: 'system', content: 'Error getting coach suggestion.' });
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setInput('');
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-500" />
            AI Mock Interview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live realistic interview based strictly on your resume</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          Interview in Progress
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx("flex flex-col max-w-4xl mx-auto", msg.role === 'candidate' ? "items-end" : "items-start")}>
            
            {msg.role === 'system' && (
              <div className="w-full text-center py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                {msg.content}
              </div>
            )}

            {msg.role === 'interviewer' && (
              <div className="flex items-start gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}

            {msg.role === 'candidate' && (
              <div className="flex flex-col items-end gap-2 max-w-[85%] w-full">
                <div className="flex items-start gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="bg-indigo-600 p-5 rounded-2xl rounded-tr-sm shadow-sm text-white">
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>

                {/* Evaluation Card */}
                {msg.evaluation && (
                  <div className="mt-4 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-500" /> AI Evaluation
                      </h4>
                      <div className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        msg.evaluation.score >= 8 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                        msg.evaluation.score >= 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      )}>
                        Score: {msg.evaluation.score} / 10
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {msg.evaluation.mistakes && msg.evaluation.mistakes.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> Areas for Improvement
                          </h5>
                          <ul className="space-y-1">
                            {msg.evaluation.mistakes.map((mistake, i) => (
                              <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="text-rose-400 mt-0.5">•</span> {mistake}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Ideal Answer
                        </h5>
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          {msg.evaluation.idealAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-4 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Interviewer is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isTyping}
            className={clsx(
              "shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm",
              isRecording 
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 animate-pulse" 
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
            )}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <div className="relative flex-1">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping || isRecording}
              placeholder={isRecording ? "Listening..." : "Type your professional answer here..."}
              className="w-full h-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full pl-6 pr-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleCoachHelp}
              disabled={isTyping || !currentQuestion}
              className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 flex items-center gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50 transition-colors text-xs font-bold shadow-sm"
              title="Ask AI Coach for a hint"
            >
              <Award className="w-4 h-4" /> Coach
            </button>
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Speak professionally. The AI interviewer evaluates accuracy, confidence, and completeness based on your resume.
        </p>
      </div>
    </div>
  );
}
