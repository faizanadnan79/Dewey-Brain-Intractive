import React, { useState } from 'react';
import Modal from './Modal';
import { getSubjectSuggestions } from '../services/geminiService';
import { SuggestIcon } from './Icons';
import { useAppContext } from '../App';

interface SuggestModalProps {
  onClose: () => void;
  onSuggestionSelect: (subject: string) => void;
}

const SuggestModal: React.FC<SuggestModalProps> = ({ onClose, onSuggestionSelect }) => {
    const { lang } = useAppContext();
    const [topic, setTopic] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) return;

        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        const result = await getSubjectSuggestions(topic, lang);
        if (result?.suggestions) {
            setSuggestions(result.suggestions);
        } else {
            setError("Could not get suggestions. Please try a different topic.");
        }
        setIsLoading(false);
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-8"><div className="loader mx-auto"></div><p className="mt-4">Generating suggestions...</p></div>;
        }
        if (suggestions.length > 0) {
            return (
                 <div>
                    <h3 className="font-semibold mb-3">Here are some suggestions for "{topic}":</h3>
                    <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionSelect(suggestion)}
                                className="w-full text-left p-3 rounded-lg border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] hover:bg-black/5 dark:hover:bg-white/10 hover:border-[color:var(--accent)] transition"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
                     <SuggestIcon />
                </div>
                <h3 className="font-semibold text-lg">Find Specific Subjects</h3>
                <p className="text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                    Enter a broad topic, and we'll suggest more specific, classifiable subjects.
                </p>
                {error && <p className="text-sm text-[color:var(--error)] mt-2">{error}</p>}
            </div>
        );
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Suggest Subjects">
            <div className="space-y-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={topic} 
                        onChange={e => setTopic(e.target.value)} 
                        placeholder="e.g., 'Space exploration' or 'cooking'"
                        className="block w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]"
                    />
                    <button type="submit" disabled={isLoading || !topic} className="text-white font-semibold py-3 px-4 rounded-lg bg-[color:var(--primary)] hover:opacity-90 transition disabled:opacity-50">
                        Suggest
                    </button>
                </form>
                <div className="min-h-[200px]">
                   {renderContent()}
                </div>
            </div>
        </Modal>
    );
};

export default SuggestModal;