
import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { getDebateClassification, getDdcNumberExplanation } from '../services/geminiService';
import { PlaceholderIcon, PlusIcon } from './Icons';
import { useAppContext } from '../App';

interface BuildStep {
  id: number;
  type: string;
  notation: string;
  explanation: string;
  isLoading: boolean;
}

const ConstructorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { lang } = useAppContext();
    const [subject, setSubject] = useState('');
    const [steps, setSteps] =useState<BuildStep[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextId, setNextId] = useState(0);

    const [newStepType, setNewStepType] = useState('Table 1 - Standard Subdivisions');
    const [newStepNotation, setNewStepNotation] = useState('');

    const finalNumber = useMemo(() => steps.map(s => s.notation).join(''), [steps]);

    const findBaseNumber = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject) {
            setError("Please enter a subject to begin.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSteps([]);

        const result = await getDebateClassification(subject, 'Find the most appropriate base number for this subject.', '23rd', lang);
        
        if (result?.finalDecision) {
            const { number, name } = result.finalDecision;
            setSteps([{ id: nextId, type: 'Base Number', notation: number, explanation: name, isLoading: false }]);
            setNextId(nextId + 1);
        } else {
            setError("Could not find a base number for the subject. Please try a different term.");
        }
        setIsLoading(false);
    };

    const addStep = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStepNotation) return;

        const newStep: BuildStep = {
            id: nextId,
            type: newStepType,
            notation: newStepNotation,
            explanation: 'Analyzing...',
            isLoading: true,
        };
        setSteps(prev => [...prev, newStep]);
        setNextId(nextId + 1);
        setNewStepNotation('');

        const context = `The current DDC number being built is ${finalNumber}${newStepNotation}. The base subject is '${subject}'. Explain what adding the notation '${newStepNotation}' from '${newStepType}' means in this context.`;
        const result = await getDdcNumberExplanation(context);
        
        setSteps(prev => prev.map(step =>
            step.id === newStep.id
                ? { ...step, explanation: result?.explanation || 'Could not get an explanation.', isLoading: false }
                : step
        ));
    };
    
    const resetConstructor = () => {
        setSubject('');
        setSteps([]);
        setError(null);
        setIsLoading(false);
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="DDC Number Constructor">
            <div className="space-y-4">
                <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 text-center border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)]">
                    <div className="flex justify-between items-center">
                       <p className="text-sm text-left text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">Constructed Number</p>
                       {steps.length > 0 && <button onClick={resetConstructor} className="text-xs font-semibold text-[color:var(--secondary)] dark:text-[color:var(--accent)] hover:underline">Start Over</button>}
                    </div>
                    <p className="text-3xl font-mono font-bold tracking-wider h-10 flex items-center justify-center">{finalNumber || '...'}</p>
                </div>

                {steps.length === 0 ? (
                    <div className="text-center p-4">
                        <PlaceholderIcon />
                        <h3 className="font-semibold text-lg">Start by finding a base number</h3>
                        <p className="text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">Enter a subject, title, or topic below.</p>
                        <form onSubmit={findBaseNumber} className="mt-4 flex gap-2">
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., 'History of computers'" className="block w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]" />
                            <button type="submit" disabled={isLoading} className="text-white font-semibold py-3 px-4 rounded-lg bg-[color:var(--primary)] hover:opacity-90 transition disabled:opacity-50">
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Find'}
                            </button>
                        </form>
                        {error && <p className="text-sm text-[color:var(--error)] mt-2">{error}</p>}
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                             <h3 className="font-semibold text-lg">Number Breakdown:</h3>
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-start gap-4 p-3 bg-black/5 dark:bg-white/10 rounded-lg">
                                    <span className="font-mono font-bold text-lg text-[color:var(--primary)] dark:text-[color:var(--accent)]">{step.notation}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{step.type}</p>
                                        <p className="text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                                            {step.isLoading ? <span className="italic">{step.explanation}</span> : step.explanation}
                                        </p>
                                    </div>
                                    {step.isLoading && <div className="w-5 h-5 border-2 border-gray-300 border-t-[color:var(--primary)] rounded-full animate-spin mt-1"></div>}
                                </div>
                            ))}
                        </div>
                        <div>
                             <h3 className="font-semibold text-lg mt-4 mb-2">Add step:</h3>
                             <form onSubmit={addStep} className="p-3 rounded-lg border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] space-y-2">
                                <select value={newStepType} onChange={e => setNewStepType(e.target.value)} className="block w-full p-2 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-md">
                                    <option>Table 1 - Standard Subdivisions</option>
                                    <option>Table 2 - Geographic Areas</option>
                                    <option>Table 3 - Subdivisions for Arts...</option>
                                    <option>Table 4 - Subdivisions of Languages</option>
                                    <option>Table 5 - Ethnic and National Groups</option>
                                    <option>Table 6 - Languages</option>
                                </select>
                                <div className="flex gap-2">
                                     <input type="text" value={newStepNotation} onChange={e => setNewStepNotation(e.target.value)} placeholder="e.g., -092 or 943" className="block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-md focus:ring-2 focus:ring-[color:var(--accent)]" />
                                     <button type="submit" disabled={!newStepNotation} className="flex items-center gap-1 text-white font-semibold py-2 px-4 rounded-lg bg-[color:var(--secondary)] hover:opacity-90 transition disabled:opacity-50">
                                        <PlusIcon /> Add
                                     </button>
                                </div>
                             </form>
                        </div>
                    </>
                )}

            </div>
        </Modal>
    );
};

export default ConstructorModal;
