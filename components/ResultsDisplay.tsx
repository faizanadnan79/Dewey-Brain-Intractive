import React, { useState } from 'react';
import type { DebateResult, VerificationResult, EditionHistoryItem } from '../types';
import { DatabaseIcon, HistoryIcon, ChatIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }> = ({ title, children, defaultOpen = false, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] pt-4 mt-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left font-bold text-lg mb-2 text-[color:var(--text-light)] dark:text-[color:var(--text-dark)] hover:opacity-80">
                <span className="flex items-center gap-2">
                    {icon} {title}
                </span>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            {isOpen && <div className="fade-in pr-2">{children}</div>}
        </div>
    );
};

// Helper component for status badges
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const lowerStatus = status.toLowerCase();

    // Per user request, don't show "Active" or uninformative statuses to reduce clutter
    if (lowerStatus.includes('active') || lowerStatus.includes('applicable')) {
        return null;
    }

    let colorClasses = 'bg-gray-500/20 text-gray-700 dark:text-gray-300'; // Default for other statuses

    if (lowerStatus.includes('obsolete')) {
        colorClasses = 'bg-red-500/20 text-red-700 dark:text-red-300';
    } else if (lowerStatus.includes('changed') || lowerStatus.includes('relocated')) {
        colorClasses = 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
    }

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold self-start ${colorClasses}`}>
            {status}
        </span>
    );
};

const EditionHistoryDisplay: React.FC<{ history: EditionHistoryItem[] }> = ({ history }) => (
    <div className="space-y-3">
        {history.map((item, index) => (
            <div key={index} className="p-3 rounded bg-black/5 dark:bg-white/5">
                <div className="flex justify-between items-start mb-1 gap-2">
                   <div className="flex-1">
                        <p className="font-bold">Edition {item.edition}</p>
                        <p className="font-mono font-semibold text-lg text-[color:var(--secondary)] dark:text-[color:var(--accent)]">{item.number}</p>
                    </div>
                   <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">{item.meaning}</p>
            </div>
        ))}
    </div>
);

const AnalysisDetails: React.FC<{ hierarchy?: string; buildSteps?: string }> = ({ hierarchy, buildSteps }) => {
    if (!hierarchy && !buildSteps) return null;
    return (
        <div className="mt-3 space-y-3">
            {hierarchy && (
                <div>
                    <p className="font-semibold text-xs text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)] uppercase tracking-wider">Hierarchy</p>
                    <p className="text-sm">{hierarchy}</p>
                </div>
            )}
            {buildSteps && (
                <div>
                    <p className="font-semibold text-xs text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)] uppercase tracking-wider">Build Steps</p>
                    <p className="whitespace-pre-wrap font-mono text-xs bg-black/5 dark:bg-white/5 p-2 rounded-md">{buildSteps}</p>
                </div>
            )}
        </div>
    );
};

const WorldcatAnalysisDisplay: React.FC<{ analysis?: string }> = ({ analysis }) => {
    if (!analysis) return null;
    return <p className="text-sm bg-black/5 dark:bg-white/5 p-3 rounded-md">{analysis}</p>;
};


const ResultsDisplay: React.FC<{ result: DebateResult | VerificationResult }> = ({ result }) => {
    const isDebateResult = (res: any): res is DebateResult => res.finalDecision !== undefined && res.oclcCandidate !== undefined;
    const editionHistory = result.editionHistory;
    const worldcatAnalysis = result.worldcatAnalysis;

    if (isDebateResult(result)) {
        return (
            <div className="space-y-4 text-sm">
                <h3 className="font-bold text-lg">✅ Suggested Classification</h3>
                <div className="border-l-4 border-[color:var(--success)] p-4 rounded bg-black/5 dark:bg-white/5">
                    <p className="font-bold text-xl font-mono text-[color:var(--success)]">{result.finalDecision.number} — {result.finalDecision.name}</p>
                    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 my-2"><div className="bg-[color:var(--success)] h-2.5 rounded-full" style={{ width: `${result.finalDecision.confidence}%` }}></div></div>
                    <p>{result.finalDecision.finalRationale}</p>
                    <AnalysisDetails 
                        hierarchy={result.finalDecision.classificationHierarchy} 
                        buildSteps={result.finalDecision.buildSteps} 
                    />
                </div>

                <CollapsibleSection title="AI Debate & Analysis" icon={<ChatIcon />}>
                    <div className="space-y-4">
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-md mb-2 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                                <DatabaseIcon /> OCLC WorldCat Candidate
                            </h4>
                            <div className="border-l-4 border-[color:var(--secondary)] p-3 rounded bg-black/5 dark:bg-white/5">
                                <p className="font-bold text-lg font-mono text-[color:var(--secondary)] dark:text-[color:var(--accent)]">{result.oclcCandidate.number} — {result.oclcCandidate.name}</p>
                                <p><strong>Justification:</strong> {result.oclcCandidate.justification}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-md mb-2 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                                AI Generated Candidates
                            </h4>
                            <div className="space-y-3">
                                {result.aiCandidates.map((candidate, i) => (
                                    <div key={i} className="border-l-4 border-[color:var(--warning)] p-3 rounded bg-black/5 dark:bg-white/5">
                                        <p className="font-bold text-lg font-mono text-[color:var(--primary)] dark:text-[color:var(--accent)]">{candidate.number} — {candidate.name}</p>
                                        <p><strong>Reason:</strong> {candidate.justification}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
                
                {worldcatAnalysis && (
                    <CollapsibleSection title="OCLC WorldCat Analysis" icon={<DatabaseIcon />}>
                        <WorldcatAnalysisDisplay analysis={worldcatAnalysis} />
                    </CollapsibleSection>
                )}
                
                {editionHistory && editionHistory.length > 0 && (
                     <CollapsibleSection title="Number History (Editions 19-23)" icon={<HistoryIcon />}>
                        <EditionHistoryDisplay history={editionHistory} />
                    </CollapsibleSection>
                )}
            </div>
        );
    } else {
        const isCorrect = result.isCorrect;
        const resultColorVar = isCorrect ? '--success' : '--error';
        const resultText = isCorrect ? 'Correct' : 'Incorrect';
        return (
            <div className="space-y-4 text-sm">
                <div className={`p-4 rounded border-l-4 border-[color:${resultColorVar}] bg-black/5 dark:bg-white/5`}>
                    <p><strong>Verification Result:</strong> <span className={`font-bold text-[color:${resultColorVar}]`}>{resultText}</span></p>
                    <p className="mt-2"><strong>Rationale:</strong> {result.verificationRationale}</p>
                </div>
                
                {!isCorrect && result.correctNumber && (
                    <div className="p-4 rounded border-l-4 border-[color:var(--secondary)] bg-black/5 dark:bg-white/5">
                        <h3 className="font-semibold">Suggested Correction</h3>
                        <p className="mt-2"><strong>Correct DDC:</strong> <span className="font-mono text-lg text-[color:var(--secondary)] dark:text-[color:var(--accent)]">{result.correctNumber}</span></p>
                        <p className="mt-2"><strong>Rationale:</strong> {result.correctNumberRationale}</p>
                        <AnalysisDetails 
                            hierarchy={result.classificationHierarchy} 
                            buildSteps={result.buildSteps} 
                        />
                    </div>
                )}

                {worldcatAnalysis && (
                    <CollapsibleSection title="OCLC WorldCat Analysis" icon={<DatabaseIcon />}>
                        <WorldcatAnalysisDisplay analysis={worldcatAnalysis} />
                    </CollapsibleSection>
                )}

                {editionHistory && editionHistory.length > 0 && (
                     <CollapsibleSection title="Number History (Editions 19-23)" icon={<HistoryIcon />}>
                        <EditionHistoryDisplay history={editionHistory} />
                    </CollapsibleSection>
                )}
            </div>
        );
    }
};

export default ResultsDisplay;