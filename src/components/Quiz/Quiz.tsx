import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldCheck, X } from 'lucide-react';
import { QuizQuestion } from '../../services/geminiService';

interface QuizProps {
  quiz: QuizQuestion[];
  quizLoading: boolean;
  quizScore: number;
  currentQuestionIndex: number;
  showQuizResult: boolean;
  selectedOption: number | null;
  isCorrect: boolean | null;
  handleOptionSelect: (index: number) => void;
  loadQuiz: () => void;
}

export const Quiz: React.FC<QuizProps> = ({
  quiz,
  quizLoading,
  quizScore,
  currentQuestionIndex,
  showQuizResult,
  selectedOption,
  isCorrect,
  handleOptionSelect,
  loadQuiz
}) => {
  if (quizLoading) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-xs font-mono text-text-muted">Gemini is drafting questions...</p>
      </div>
    );
  }

  if (quiz.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-text-muted text-sm">Test your cricket knowledge with our Gemini-powered quiz.</p>
        <button 
          onClick={loadQuiz}
          className="bg-accent/10 text-accent border border-accent/20 px-6 py-2 rounded-xl text-xs font-bold hover:bg-accent/20 transition-all"
        >
          START AI QUIZ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!showQuizResult ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-[10px] font-mono text-text-muted mb-2">
            <span>QUESTION {currentQuestionIndex + 1} OF {quiz.length}</span>
            <span>SCORE: {quizScore}</span>
          </div>
          <h4 className="text-xl font-bold mb-6">{quiz[currentQuestionIndex].question}</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {quiz[currentQuestionIndex].options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={selectedOption !== null}
                className={`p-4 rounded-xl border text-sm text-left transition-all ${
                  selectedOption === idx 
                    ? (isCorrect ? 'border-accent bg-accent/10' : 'border-danger bg-danger/10')
                    : (selectedOption !== null && idx === quiz[currentQuestionIndex].correctIndex ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-white/5')
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selectedOption === idx && (
                    isCorrect ? <ShieldCheck className="w-4 h-4 text-accent" /> : <X className="w-4 h-4 text-danger" />
                  )}
                </div>
              </button>
            ))}
          </div>
          {selectedOption !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-bg-card border border-border rounded-xl text-xs text-text-muted italic"
            >
              <span className="font-bold text-accent">Analysis:</span> {quiz[currentQuestionIndex].explanation}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <div className="text-5xl mb-4">🏆</div>
          <h4 className="text-2xl font-black">Quiz Complete!</h4>
          <p className="text-text-muted">You scored <span className="text-accent font-bold">{quizScore}</span> out of {quiz.length}</p>
          <button 
            onClick={loadQuiz}
            className="bg-accent text-bg px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};
