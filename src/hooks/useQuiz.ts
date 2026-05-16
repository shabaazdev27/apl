import { useState } from 'react';
import { generateQuiz, QuizQuestion } from '../services/geminiService';
import { getTeamPlayers } from '../services/cricApi';

export const useQuiz = () => {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const loadQuiz = async () => {
    setQuizLoading(true);
    setShowQuizResult(false);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setIsCorrect(null);
    try {
      const teamData = await getTeamPlayers('2');
      if (teamData && teamData.player) {
        const players = teamData.player.map((p: any) => ({ name: p.name, role: p.role }));
        const newQuiz = await generateQuiz(players);
        setQuiz(newQuiz);
      }
    } catch (e) {
      console.error("Quiz load error", e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const correct = index === quiz[currentQuestionIndex].correctIndex;
    setIsCorrect(correct);
    if (correct) setQuizScore(s => s + 1);

    setTimeout(() => {
      if (currentQuestionIndex < quiz.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowQuizResult(true);
      }
    }, 2000);
  };

  return {
    quiz, quizLoading, quizScore, currentQuestionIndex, showQuizResult,
    selectedOption, isCorrect, loadQuiz, handleOptionSelect
  };
};
