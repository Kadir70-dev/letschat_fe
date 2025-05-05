'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';


export default function ChatBox() {
  const [message, setMessage] = useState<string>('');
  const [chat, setChat] = useState<any[]>([]);
  const [typing, setTyping] = useState<boolean>(false);
  const [isVideoChatActive, setIsVideoChatActive] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  // Video Chat Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<any>(null);
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    socketRef.current = io(`http://${host}:5000`);

    // Listen for incoming messages
    socketRef.current.on('receiveMessage', (msg: any) => {
      setChat((prevChat) => [...prevChat, msg]);
    });

    // Listen for typing indicator
    socketRef.current.on('typing', (user: string) => {
      setTyping(user === 'Friend');
    });

    // WebRTC: Incoming signal
    socketRef.current.on('videoSignal', (data) => {
      if (!peerRef.current) {
        startPeer(false, data.signal);
      } else {
        peerRef.current.signal(data.signal);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      const msg = { text: message, sender: 'You', status: 'sent' };
      socketRef.current.emit('sendMessage', msg);
      setMessage('');
      setTyping(false);
    }
  };

  const handleTyping = () => {
    socketRef.current?.emit('typing', 'You');
  };

  // 🎥 Start Video Chat
  const startVideoChat = async () => {
    setVideoStarted(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play();
    }

    startPeer(true, null, stream);
  };

  const startPeer = (initiator: boolean, incomingSignal: any = null, stream: MediaStream | null = null) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal: any) => {
      socketRef.current?.emit('videoSignal', { signal });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play();
      }
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    peerRef.current = peer;
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

      <div className="flex mb-4">
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

      <button
        onClick={startVideoChat}
        className="bg-green-600 text-white w-full py-2 rounded mb-2"
        disabled={videoStarted}
      >
        {videoStarted ? 'Video Started' : 'Start Video Chat'}
      </button>

      <div className="flex gap-4 justify-center">
        <video ref={localVideoRef} className="w-1/2 border rounded" muted playsInline></video>
        <video ref={remoteVideoRef} className="w-1/2 border rounded" playsInline></video>
      </div>
    </div>
  );
}
