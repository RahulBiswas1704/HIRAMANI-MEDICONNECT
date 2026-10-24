'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  RotateCcw,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Stethoscope,
  Clock,
  ArrowLeft,
  X,
  MessageSquare,
} from 'lucide-react';
import { ChatMessage } from '@/types';

interface WhatsAppSimulatorProps {
  onClose?: () => void;
  isStandalone?: boolean;
}

export function WhatsAppSimulator({ onClose, isStandalone = false }: WhatsAppSimulatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('919876543210');
  const [isHandover, setIsHandover] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const startConversation = useCallback(async (isReset = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: 'menu', reset: isReset }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages([
          {
            id: 'msg-init',
            sender: 'bot',
            text: data.reply.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: data.reply.buttons,
          },
        ]);
        setIsHandover(data.session?.is_human_handover || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  // Initial welcome message
  useEffect(() => {
    startConversation(true);
  }, [startConversation]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: text }),
      });
      const data = await res.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: data.session?.is_human_handover ? 'agent' : 'bot',
          text: data.reply.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: data.reply.buttons,
        };
        setMessages(prev => [...prev, botMsg]);
        setIsHandover(data.session?.is_human_handover || false);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'bot',
            text: '⚠️ An error occurred while processing your message. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ Network connection error. Please verify server status.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col bg-[#e5ddd5] overflow-hidden ${isStandalone ? 'w-full h-full max-w-md mx-auto shadow-2xl rounded-2xl border border-slate-300' : 'w-full h-[620px] rounded-2xl shadow-2xl border border-slate-300'}`}>
      {/* WhatsApp Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-[#128c7e] rounded-full transition text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#075e54] shadow-sm">
              <Stethoscope className="w-6 h-6 text-[#075e54]" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm leading-tight">Hiramani Memorial Hospital</h3>
              <span className="bg-emerald-500 text-[10px] text-white px-1.5 py-0.2 rounded font-medium">Verified</span>
            </div>
            <p className="text-[11px] text-emerald-100 leading-tight">
              {isHandover ? '👨‍💼 Reception Staff Connected' : 'Official WhatsApp Assistant • Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <button
            onClick={() => startConversation(true)}
            title="Restart Session"
            className="p-1.5 hover:bg-[#128c7e] rounded-full transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} title="Close" className="p-1.5 hover:bg-[#128c7e] rounded-full transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Demo Sandbox Banner */}
      <div className="bg-amber-100 border-b border-amber-200 px-3 py-1.5 text-center text-xs text-amber-900 flex items-center justify-center gap-1.5 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        Interactive Patient Demo Simulator (Zero External Setup Required)
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d3ccc3' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Encryption notice */}
        <div className="flex justify-center">
          <div className="bg-[#ffeecd] text-amber-900 text-[11px] py-1 px-3 rounded-lg shadow-sm max-w-xs text-center border border-amber-200/60 flex items-center gap-1">
            <span className="font-semibold">🔒 HIPAA/NABH Ready:</span> Messages use Meta 256-bit Cloud API architecture.
          </div>
        </div>

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2 text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                  : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/50'
              }`}
            >
              {/* Message text with bold parsing */}
              <div>{msg.text}</div>

              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
                <span>{msg.timestamp}</span>
                {msg.sender === 'user' && (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                )}
              </div>
            </div>

            {/* Quick action buttons rendered under bot messages */}
            {msg.options && msg.options.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                {msg.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleSendMessage(opt.id)}
                    className="bg-white hover:bg-emerald-50 text-[#075e54] border border-[#128c7e]/40 hover:border-[#128c7e] text-xs font-medium px-3 py-1.5 rounded-full shadow-sm transition active:scale-95"
                  >
                    {opt.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-xs text-slate-500 w-fit shadow-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            </div>
            <span>Hiramani Memorial Hospital is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips matching 7-Option Menu */}
      <div className="bg-[#f0f2f5] px-3 py-1.5 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
        <button
          onClick={() => handleSendMessage('1')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          1️⃣ Doctor & Apt
        </button>
        <button
          onClick={() => handleSendMessage('2')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          2️⃣ Departments
        </button>
        <button
          onClick={() => handleSendMessage('3')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          3️⃣ Diagnostics
        </button>
        <button
          onClick={() => handleSendMessage('4')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          4️⃣ Admission
        </button>
        <button
          onClick={() => handleSendMessage('5')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          5️⃣ Location & Contact
        </button>
        <button
          onClick={() => handleSendMessage('6')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          6️⃣ Billing & Insurance
        </button>
        <button
          onClick={() => handleSendMessage('7')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          7️⃣ Speak to Staff
        </button>
        <button
          onClick={() => handleSendMessage('জরুরি')}
          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-[11px] font-medium"
        >
          🚨 জরুরি (Emergency)
        </button>
        <button
          onClick={() => handleSendMessage('menu')}
          className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 text-[11px] font-medium"
        >
          📋 Menu
        </button>
      </div>

      {/* Input Bar */}
      <div className="bg-[#f0f2f5] px-3 py-2.5 flex items-center gap-2 border-t border-slate-300">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Type a message or option number (e.g. 1)..."
          className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128c7e] text-slate-800"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="w-10 h-10 rounded-full bg-[#128c7e] hover:bg-[#075e54] text-white flex items-center justify-center transition disabled:opacity-50 active:scale-95 shadow"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
