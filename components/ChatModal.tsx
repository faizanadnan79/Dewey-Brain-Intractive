import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import Modal from './Modal';
import { startChat } from '../services/geminiService';
import { SendIcon } from './Icons';
import { useAppContext } from '../App';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { lang } = useAppContext();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const chatSession = startChat(lang);
        setChat(chatSession);
        setMessages([{ role: 'model', content: "Hello! How can I help you with DDC classification today?" }]);
    }, [lang]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userInput: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userInput]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="AI Chat">
            <div className="flex flex-col h-[65vh]">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-[color:var(--primary)] text-white rounded-br-none' : 'bg-black/10 dark:bg-white/10 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="max-w-md p-3 rounded-2xl bg-black/10 dark:bg-white/10 rounded-bl-none">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-0"></span>
                                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-4 border-t border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] pt-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Ask about DDC..."
                            className="flex-1 block w-full px-4 py-2 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-[color:var(--primary)] text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default ChatModal;