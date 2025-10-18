
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getQuizQuestions } from '../services/geminiService';
import type { QuizQuestion } from '../types';

const QuizModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'summary'>('start');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    const startQuiz = async () => {
        setGameState('loading');
        const result = await getQuizQuestions(0, 5, 'en'); // Stage 0, 5 questions
        if (result?.questions) {
            setQuestions(result.questions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setGameState('playing');
        } else {
            alert("Failed to load quiz questions.");
            setGameState('start');
        }
    };

    const handleAnswer = () => {
        if (selectedAnswer === null) return;
        setIsAnswered(true);
        if (selectedAnswer === questions[currentQuestionIndex].a) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setGameState('summary');
        }
    };
    
    const renderContent = () => {
        switch (gameState) {
            case 'loading':
                return <div className="text-center p-8"><div className="loader mx-auto"></div><p className="mt-4">Generating questions...</p></div>;
            
            case 'playing':
                const q = questions[currentQuestionIndex];
                return (
                    <div>
                        <p className="text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">Question {currentQuestionIndex + 1} of {questions.length}</p>
                        <p className="text-lg font-semibold my-4">{q.q}</p>
                        <div className="space-y-3">
                            {q.o.map((option, index) => {
                                let optionClass = "w-full text-left p-4 rounded-lg border transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed";
                                if (isAnswered) {
                                    if (index === q.a) optionClass += " correct";
                                    else if (index === selectedAnswer) optionClass += " incorrect";
                                } else {
                                    if (index === selectedAnswer) optionClass += " border-[color:var(--secondary)] bg-blue-500/10";
                                    else optionClass += " border-[color:var(--border-light)] dark:border-[color:var(--border-dark)]";
                                }
                                return (
                                    <button key={index} disabled={isAnswered} onClick={() => setSelectedAnswer(index)} className={optionClass}>
                                        <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                                    </button>
                                );
                            })}
                        </div>
                        {isAnswered && (
                            <div className="mt-4 p-3 bg-blue-500/10 text-sm rounded-lg">
                                <strong>Explanation:</strong> {q.e}
                            </div>
                        )}
                        <div className="flex justify-end mt-6">
                            {!isAnswered ? (
                                <button onClick={handleAnswer} disabled={selectedAnswer === null} className="font-semibold py-2 px-6 rounded-lg bg-[color:var(--primary)] text-white disabled:opacity-50">Submit</button>
                            ) : (
                                <button onClick={handleNext} className="font-semibold py-2 px-6 rounded-lg bg-[color:var(--success)] text-white">Next &rarr;</button>
                            )}
                        </div>
                    </div>
                );

            case 'summary':
                return (
                     <div className="text-center p-8">
                        <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                        <p className="text-4xl my-4">Your score: <span className="font-bold text-[color:var(--accent)]">{score} / {questions.length}</span></p>
                        <button onClick={startQuiz} className="font-semibold py-2 px-6 rounded-lg bg-[color:var(--primary)] text-white">Play Again</button>
                    </div>
                );
            
            case 'start':
            default:
                return (
                    <div className="text-center p-8">
                        <h3 className="text-2xl font-bold">DDC Knowledge Challenge</h3>
                        <p className="my-4">Test your expertise with unique, AI-generated questions.</p>
                        <button onClick={startQuiz} className="font-semibold py-2 px-6 rounded-lg bg-[color:var(--primary)] text-white">Start Quiz</button>
                    </div>
                );
        }
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="DDC Quiz">
            {renderContent()}
        </Modal>
    );
};

export default QuizModal;
