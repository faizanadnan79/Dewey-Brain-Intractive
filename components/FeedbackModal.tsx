
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppContext } from '../App';

// Tell TypeScript that emailjs is a global variable from the script tag in index.html
declare const emailjs: any;

const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useAppContext();
    const [feedbackType, setFeedbackType] = useState('Suggestion');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // IMPORTANT: You need to replace these placeholders with your actual EmailJS details
    // from your EmailJS account dashboard. The Service ID has been pre-filled.
    const SERVICE_ID = 'service_xf804ge';
    const TEMPLATE_ID = 'template_s4rcodl'; // Replace with your Template ID
    const PUBLIC_KEY = 'WDegxLqhK5_qjTWi6';   // Replace with your Public Key (also called User ID)

    useEffect(() => {
        if (typeof emailjs === 'undefined') {
            console.error("EmailJS script not loaded. Please check index.html.");
            setErrorMessage("Feedback library failed to load.");
            setStatus('error');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        // Prevent submission if EmailJS credentials are still placeholders.
        // FIX: Use type assertion to string to avoid TypeScript error about non-overlapping literal types.
        // This preserves the check in case the keys are reverted to placeholders during development.
        if ((TEMPLATE_ID as string) === 'YOUR_TEMPLATE_ID' || (PUBLIC_KEY as string) === 'YOUR_PUBLIC_KEY') {
            console.error("EmailJS Error: TEMPLATE_ID or PUBLIC_KEY is not set. Please replace the placeholder values in FeedbackModal.tsx.");
            setErrorMessage(t('feedbackConfigError'));
            setStatus('error');
            return;
        }

        if (!message.trim()) {
            setErrorMessage('Please enter a message.');
            return;
        }

        setStatus('sending');

        const templateParams = {
            feedback_type: feedbackType,
            from_name: name || 'Anonymous',
            message: message,
        };

        try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            setStatus('success');
        } catch (err: any) {
            console.error('Failed to send feedback:', err);
            const errorDetails = err.text || JSON.stringify(err) || "An unknown error occurred.";
            console.error('EmailJS Error Details:', errorDetails);
            setErrorMessage(t('feedbackSubmitError'));
            setStatus('error');
        }
    };

    const inputClass = "block w-full px-4 py-2 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] disabled:opacity-70";
    
    const renderContent = () => {
        if (status === 'success') {
            return (
                <div className="text-center p-4">
                    <h3 className="text-xl font-bold">{t('feedbackThankYou')}</h3>
                    <p className="my-4 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                        {t('feedbackSubmitSuccess')}
                    </p>
                    <button
                        onClick={onClose}
                        className="inline-block text-center text-white font-semibold py-2 px-6 rounded-lg bg-[color:var(--secondary)] hover:opacity-90 transition"
                    >
                        Close
                    </button>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('feedbackType')}</label>
                    <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)} className={inputClass} disabled={status === 'sending'}>
                        <option value="Suggestion">{t('feedbackTypeSuggestion')}</option>
                        <option value="Bug Report">{t('feedbackTypeBug')}</option>
                        <option value="Praise">{t('feedbackTypePraise')}</option>
                        <option value="Other">{t('feedbackTypeOther')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('yourName')}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        className={inputClass}
                        disabled={status === 'sending'}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('message')}</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={t('feedbackPlaceholder')}
                        required
                        rows={5}
                        className={inputClass}
                        disabled={status === 'sending'}
                    />
                </div>
                
                {errorMessage && (
                    <p className="text-sm text-center text-[color:var(--error)]">
                        {errorMessage}
                    </p>
                )}

                <div className="pt-2">
                    <button type="submit" className="w-full text-white font-semibold py-3 px-4 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] dark:from-[var(--secondary)] dark:to-[var(--accent)] hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center min-h-[48px]" disabled={status === 'sending'}>
                        {status === 'sending' ? (
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            t('submitFeedback')
                        )}
                    </button>
                </div>
            </form>
        );
    };


    return (
        <Modal isOpen={true} onClose={onClose} title={t('feedbackTitle')}>
            {renderContent()}
        </Modal>
    );
};

export default FeedbackModal;