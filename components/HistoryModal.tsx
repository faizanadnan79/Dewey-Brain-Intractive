
import React, { useState } from 'react';
import Modal from './Modal';
import type { HistoryItem, DebateResult, VerificationResult } from '../types';
import ResultsDisplay from './ResultsDisplay';
import { useAppContext } from '../App';
import { PlaceholderIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface HistoryModalProps {
  history: HistoryItem[];
  onClose: () => void;
  onClearHistory: () => void;
}

const timeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory }) => {
    const { t } = useAppContext();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleItem = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const getResultSummary = (item: HistoryItem) => {
        if (item.mode === 'debate') {
            return (item.resultData as DebateResult).finalDecision.number;
        } else {
            const res = item.resultData as VerificationResult;
            return res.isCorrect ? 'Correct' : 'Incorrect';
        }
    }

    return (
        <Modal 
          isOpen={true} 
          onClose={onClose} 
          title={t('classificationHistory')}
        >
            {history.length === 0 ? (
                <div className="text-center text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)] p-8">
                    <PlaceholderIcon />
                    <p>{t('emptyHistory')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="text-right">
                        <button onClick={onClearHistory} className="flex items-center gap-2 text-sm font-semibold text-[color:var(--error)] hover:opacity-80 transition-opacity ml-auto">
                           <TrashIcon /> {t('clearHistory')}
                        </button>
                    </div>
                    {history.map((item, index) => (
                        <div key={item.timestamp} className="border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg">
                            <button onClick={() => toggleItem(index)} className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex-1">
                                    <p className="font-semibold truncate pr-2">{item.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                                        <span className={`px-2 py-0.5 rounded-full ${item.mode === 'debate' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-green-500/20 text-green-700 dark:text-green-300'}`}>
                                            {item.mode === 'debate' ? t('modeGenerate') : t('modeVerify')}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-700 dark:text-gray-300 text-xs">
                                            {item.edition}
                                        </span>
                                        <span>{timeAgo(item.timestamp)}</span>
                                        <span className="font-mono bg-black/10 dark:bg-white/10 px-1.5 rounded">{getResultSummary(item)}</span>
                                    </div>
                                </div>
                                {expandedIndex === index ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            </button>
                            {expandedIndex === index && (
                                <div className="border-t border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] p-4">
                                    <ResultsDisplay result={item.resultData} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default HistoryModal;