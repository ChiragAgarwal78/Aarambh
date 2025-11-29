import React, { useState, useRef, useEffect } from 'react';

const AgentChatPanel = ({ initialSteps }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'agent',
            text: "Hello, I've analyzed the call. The patient is likely suffering from Cardiac Arrest (94% confidence).",
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            sender: 'agent',
            text: "I recommend following the Cardiac Arrest protocol. Here are the first few steps:\n" +
                initialSteps.slice(0, 3).map(s => `- ${s}`).join('\n'),
            timestamp: new Date().toISOString()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMessage = {
            id: messages.length + 1,
            sender: 'user',
            text: inputValue,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');

        // Simulate agent response
        setTimeout(() => {
            const responseText = generateAgentResponse(inputValue);
            setMessages(prev => [...prev, {
                id: prev.length + 1,
                sender: 'agent',
                text: responseText,
                timestamp: new Date().toISOString()
            }]);
        }, 1000);
    };

    const generateAgentResponse = (input) => {
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('step') || lowerInput.includes('next')) {
            return "The next step is: Check breathing and pulse. If no pulse, begin CPR immediately.";
        } else if (lowerInput.includes('ambulance') || lowerInput.includes('eta')) {
            return "The nearest ambulance (AMB-042) is 5.2 minutes away. I recommend dispatching it immediately.";
        } else if (lowerInput.includes('hospital')) {
            return "The nearest cardiac center is City Hospital, 12 minutes away.";
        } else {
            return "I've noted that. Is there anything specific you need help with regarding the protocol?";
        }
    };

    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '400px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                backgroundColor: '#252525',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#2196F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        A
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#fff' }}>Aarambh Agent</h3>
                        <div style={{ fontSize: '11px', color: '#81c784', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#81c784', borderRadius: '50%' }}></span>
                            Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: '#121212',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            backgroundColor: msg.sender === 'user' ? '#1565c0' : '#2c2c2c',
                            color: '#e0e0e0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            border: msg.sender === 'agent' ? '1px solid #333' : 'none'
                        }}>
                            {msg.text}
                        </div>
                        <span style={{ fontSize: '11px', color: '#666', marginTop: '6px', margin: '0 4px' }}>
                            {msg.sender === 'agent' ? 'Assistant' : 'You'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{
                padding: '16px',
                backgroundColor: '#252525',
                borderTop: '1px solid #333',
                display: 'flex',
                gap: '12px'
            }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message to the agent..."
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '24px',
                        border: '1px solid #444',
                        outline: 'none',
                        fontSize: '14px',
                        backgroundColor: '#1e1e1e',
                        color: 'white'
                    }}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    style={{
                        backgroundColor: inputValue.trim() ? '#2196F3' : '#424242',
                        color: 'white',
                        border: 'none',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        cursor: inputValue.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                    }}
                >
                    ➤
                </button>
            </form>
        </div>
    );
};

export default AgentChatPanel;
