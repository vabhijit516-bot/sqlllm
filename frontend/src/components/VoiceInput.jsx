import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser version. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error('Speech error:', e);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        onTranscript(text);
      }
    };

    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2.5 rounded-xl border transition-all ${
        isListening
          ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
          : 'bg-slate-800/80 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/80 border-slate-700/60'
      }`}
      title={isListening ? 'Stop Listening' : 'Voice Query Input'}
    >
      {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
