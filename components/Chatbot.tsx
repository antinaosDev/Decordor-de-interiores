import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';

const ChatIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', text: "¡Hola! ¿Cómo puedo ayudarte con tu proyecto de diseño de interiores hoy?", sender: 'bot' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!userInput.trim()) return;

        const newUserMessage: ChatMessage = { id: crypto.randomUUID(), text: userInput, sender: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        const history = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        try {
            const botResponseText = await getChatResponse(history, userInput);
            const newBotMessage: ChatMessage = { id: crypto.randomUUID(), text: botResponseText, sender: 'bot' };
            setMessages(prev => [...prev, newBotMessage]);
        } catch (error) {
            console.error("Error del chatbot:", error);
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), text: "Lo siento, estoy teniendo problemas para conectarme en este momento.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-5 right-5 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-110"
                >
                    {isOpen ? <CloseIcon className="w-6 h-6" /> : <ChatIcon className="w-6 h-6" />}
                </button>
            </div>
            
            {isOpen && (
                <div className="fixed bottom-20 right-5 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-40">
                    <header className="bg-indigo-600 text-white p-3 rounded-t-lg">
                        <h3 className="font-semibold text-center">Asistente DecorAI</h3>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="px-3 py-2 rounded-lg bg-gray-200 text-gray-800">
                                    <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Haz una pregunta..."
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            )}
        </>
    );
};