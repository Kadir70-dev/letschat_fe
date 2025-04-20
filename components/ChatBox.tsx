'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function ChatBox() {
  const [message, setMessage] = useState<string>('');
  const [chat, setChat] = useState<any[]>([]);
  const [typing, setTyping] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    // Listen for incoming messages
    socketRef.current.on('receiveMessage', (msg: any) => {
      setChat((prevChat) => [...prevChat, msg]);
    });

    // Listen for typing indicator
    socketRef.current.on('typing', (user: string) => {
      setTyping(user === 'Friend');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      const msg = { text: message, sender: 'You', status: 'sent' };
      socketRef.current.emit('sendMessage', msg);  // Emit message to server
      setMessage('');
      setTyping(false);
    }
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', 'You');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">Realtime Chat</h1>

      <div className="border rounded-lg p-3 h-64 overflow-y-auto mb-4 bg-gray-50 shadow-inner">
        {chat.map((msg, idx) => (
          <div key={idx} className={`mb-4 flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-center max-w-xs ${msg.sender === 'You' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'} rounded-xl p-3`}>
              <div>{msg.text}</div>
              <div className={`ml-2 text-xs ${msg.status === 'seen' ? 'text-green-500' : 'text-gray-500'}`}>
                {msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : '✓✓ Seen'}
              </div>
            </div>
          </div>
        ))}
        {typing && <div className="text-gray-500 text-sm">Friend is typing...</div>}
      </div>

      <div className="flex">
        <input
          type="text"
          className="border p-2 flex-grow mr-2 rounded"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            handleTyping();
            if (e.key === 'Enter') sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}