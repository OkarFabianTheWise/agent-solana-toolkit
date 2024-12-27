import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
import logo from '../../assets/wlogo.png';
import AIResponder from './Aimodule';
import { analyzeResponse } from '../solana/analyser';

// Agent component to handle user interactions and chat functionality
const Agent: React.FC = () => {
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false); // To handle loading state
    const aiResponder = new AIResponder(); // Initialize the AI responder

    const handleSendMessage = async () => {
        if (inputMessage.trim() !== '') {
            setMessages([...messages, { text: inputMessage, isUser: true }]);
            setInputMessage('');
            setLoading(true);
    
            try {
                // Fetch AI response
                const aiResponse = await aiResponder.processTextInput(inputMessage);
                setMessages((prevMessages) => [...prevMessages, { text: aiResponse, isUser: false }]);
    
                // Analyze the response and perform the associated operation
                const operationResult = await analyzeResponse(aiResponse);
                setMessages((prevMessages) => [...prevMessages, { text: operationResult, isUser: false }]);
            } catch (error) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: "Sorry, I encountered an error. Please try again.", isUser: false },
                ]);
                console.error("Error processing message:", error);
            } finally {
                setLoading(false);
            }
        }
    };
    

    return (
        <div className="min-h-screen bg-black bg-center text-white text-center p-5 relative">
            <img src={logo} alt="Weaveit Logo" className="absolute top-0 left-0 w-full h-full opacity-10 object-contain" />
            <header className="flex justify-between items-center p-4 relative z-10">
                <img src={logo} alt="Weaveit Logo" className="h-20" />
                <div className="flex space-x-4">
                    <a href="https://x.com/weaveItAgent" target="_blank" rel="noopener noreferrer">
                        <button className="bg-[#3BE803] text-white py-2 px-4 rounded-full font-bold">TWITTER</button>
                    </a>
                </div>
            </header>
            <div className="mt-18 relative z-10">
                <div className="max-w-2xl mx-auto bg-gray-900 rounded-lg p-4 mt-8">
                    <div className="h-96 overflow-y-auto mb-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`mb-2 ${message.isUser ? 'text-right' : 'text-left'}`}>
                                <span className={`inline-block p-2 rounded-lg ${message.isUser ? 'bg-[#3BE803] text-black' : 'bg-gray-700'}`}>
                                    {message.text}
                                </span>
                            </div>
                        ))}
                        {loading && <div className="text-gray-400 text-left">AI is typing...</div>}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                }
                            }}
                            className="flex-grow bg-gray-800 text-white rounded-l-full py-2 px-4 focus:outline-none"
                            placeholder="Type your message..."
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-[#3BE803] text-black py-2 px-6 rounded-r-full font-bold"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Agent;
