
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getLivePracticeTitles } from '../services/geminiService';
import type { PracticeQuestion } from '../types';

const LivePracticeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'summary'>('start');
    const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    const startPractice = async () => {
        setGameState('loading');
        const result = await getLivePracticeTitles(5, 'en');
        if (result?.titles) {
            const practiceQuestions = result.titles.map(title => ({
                title, userAnswer: '', correctAnswer: '', explanation: '', score: 0, timeTaken: 0, result: null
            }));
            setQuestions(practiceQuestions);
            setCurrentIndex(0);
            setScore(0);
            setUserAnswer('');
            setGameState('playing');
        } else {
            alert('Failed to load practice questions.');
            setGameState('start');
        }
    };

    const handleSubmit = () => {
        // In a real scenario, this would call another Gemini function to evaluate the answer.
        // For this demo, we'll just move to the next question.
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserAnswer('');
        } else {
            setGameState('summary');
        }
    };

    const renderContent = () => {
        switch (gameState) {
            case 'loading':
                 return <div className="text-center p-8"><div className="loader mx-auto"></div><p className="mt-4">Preparing your practice session...</p></div>;

            case 'playing':
                const q = questions[currentIndex];
                return (
                    <div>
                        <p className="text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">Question {currentIndex + 1} of {questions.length}</p>
                        <div className="text-center my-6">
                            <p className="text-sm">Classify this title:</p>
                            <p className="text-xl font-semibold my-2">{q.title}</p>
                        </div>
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="block w-full text-center text-xl font-mono px-4 py-3 bg-white/50 dark:bg-black/20 border-2 border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]"
                            placeholder="Enter DDC Number"
                        />
                        <div className="flex justify-end mt-6">
                            <button onClick={handleSubmit} className="font-semibold py-2 px-6 rounded-lg bg-[color:var(--primary)] text-white">Submit</button>
                        </div>
                    </div>
                );
            
            case 'summary':
                return (
                    <div className="text-center p-8">
                        <h3 className="text-2xl font-bold">Practice Complete!</h3>
                        <button onClick={startPractice} className="mt-4 font-semibold py-2 px-6 rounded-lg bg-[color:var(--primary)] text-white">Play Again</button>
                    </div>
                );

            default:
                 return (
                    <div className="text-center p-8">
                        <h3 className="text-2xl font-bold">Live Practice Mode</h3>
                        <p className="my-4">Classify 5 titles against the clock.</p>
                        <button onClick={startPractice} className="font-semibold py-2 px-6 rounded-lg bg-[color:var(--primary)] text-white">Start Practice</button>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Live Practice">
            {renderContent()}
        </Modal>
    );
};

export default LivePracticeModal;
