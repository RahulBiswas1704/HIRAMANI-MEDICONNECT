'use client';

import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { WhatsAppSimulator } from './WhatsAppSimulator';

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {!isOpen && (
          <div className="mb-2 bg-slate-900 text-white text-xs font-medium py-1 px-3 rounded-full shadow-lg animate-bounce flex items-center gap-1.5 border border-slate-700">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            Test Live Patient WhatsApp Bot
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-[#25d366] hover:bg-[#20ba5c] text-white shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 border-2 border-white focus:outline-none"
          title="Open WhatsApp Demo Simulator"
        >
          {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        </button>
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 flex items-center justify-center sm:block">
          <div className="w-full h-full sm:w-[400px] sm:h-[620px] max-w-lg p-2 sm:p-0">
            <WhatsAppSimulator onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
