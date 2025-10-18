

import React from 'react';
import Modal from './Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { HistoryItem, DebateResult, VerificationResult } from '../types';
import { useAppContext } from '../App';

const InsightsModal: React.FC<{ history: HistoryItem[], onClose: () => void }> = ({ history, onClose }) => {
    const { theme } = useAppContext();
    const textColor = theme === 'dark' ? '#E8EBF0' : '#1E1E2F';

    const classCounts = history.reduce((acc, item) => {
        let number;
        if (item.mode === 'debate') {
            number = (item.resultData as DebateResult).finalDecision?.number;
        } else {
            const verificationResult = item.resultData as VerificationResult;
            // Fix: Correctly determine the DDC number for insights.
            // Use the verified number if it was correct, or the suggested correct number if it was incorrect.
            number = verificationResult.isCorrect ? item.ddcNumberToVerify : verificationResult.correctNumber;
        }
        
        if (number) {
            const mainClass = number.substring(0, 1) + '00s';
            acc[mainClass] = (acc[mainClass] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });

    const chartData = ['000s', '100s', '200s', '300s', '400s', '500s', '600s', '700s', '800s', '900s'].map(cls => ({
        name: cls,
        count: classCounts[cls] || 0
    }));

    return (
        <Modal isOpen={true} onClose={onClose} title="Performance Insights">
            <div className="h-[400px]">
                <h3 className="font-semibold mb-4 text-center">Classification by Main Class</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#30384c' : '#e0e6f1'} />
                        <XAxis dataKey="name" tick={{ fill: textColor }} />
                        <YAxis allowDecimals={false} tick={{ fill: textColor }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1C2235' : '#FFFFFF',
                                border: `1px solid ${theme === 'dark' ? '#30384c' : '#e0e6f1'}`
                            }}
                        />
                        <Bar dataKey="count" fill="var(--secondary)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Modal>
    );
};

export default InsightsModal;
