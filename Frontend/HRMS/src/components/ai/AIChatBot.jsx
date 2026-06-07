import React, { useState, useEffect, useRef } from "react";

export default function AIChatBot() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am HERA AI. How can I assist with your workflow matrix today?" }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech-to-Text Engine
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel(); // Interrupt voice readout
    };

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      if (spokenText.trim()) {
        handleSendMessage(spokenText);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  // Voice Readout Engine
  const speakResponse = (textToSpeak) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    const voiceProfile = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female") || v.lang.includes("en-US"));
    if (voiceProfile) utterance.voice = voiceProfile;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = (textToSend = input) => {
    if (!textToSend.trim()) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // 1. Append User Message
    const updatedMessages = [...messages, { sender: "user", text: textToSend }];
    setMessages(updatedMessages);
    setInput("");

    // 2. Generate Simulated Response (Replace with real API endpoint as needed)
    setTimeout(() => {
      const fallbackReply = `Processed request for: "${textToSend}". Hera database metrics are operational.`;
      setMessages(prev => [...prev, { sender: "ai", text: fallbackReply }]);
      speakResponse(fallbackReply);
    }, 800);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return alert("Speech recognition is not supported on this browser.");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-between max-w-xl mx-auto min-h-[500px]">
      
      {/* Header Container */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
        <h2 className="text-xl font-bold text-slate-800">
          HERA AI Assistant
        </h2>
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          Online
        </span>
      </div>

      {/* Dynamic Conversational Timeline */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-5 max-h-80 pr-1">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-2xl text-sm max-w-[85%] ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white ml-auto rounded-tr-none"
                : "bg-slate-50 text-slate-700 mr-auto rounded-tl-none border border-slate-100"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Suggested Quick Menus */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button onClick={() => handleSendMessage("Screen top candidates for Software Engineer role")} className="p-2.5 text-left rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs text-slate-600 transition-colors">
          🔍 Screen top candidates
        </button>
        <button onClick={() => handleSendMessage("Generate monthly HR report")} className="p-2.5 text-left rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs text-slate-600 transition-colors">
          📊 Generate monthly HR report
        </button>
        <button onClick={() => handleSendMessage("Detect attendance anomalies")} className="p-2.5 text-left rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs text-slate-600 transition-colors">
          ⚠ Detect attendance anomalies
        </button>
        <button onClick={() => handleSendMessage("Recommend employees for promotion")} className="p-2.5 text-left rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs text-slate-600 transition-colors">
          🎯 Promotion Candidates
        </button>
      </div>

      {/* Listening Status Bar */}
      {isListening && (
        <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1.5 mb-2 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Hera is recording voice input stream...
        </div>
      )}

      {/* Form Interaction controls */}
      <div className="flex gap-2 items-center">
        {/* Voice Trigger Microphone */}
        <button
          type="button"
          onClick={toggleMic}
          className={`p-3 rounded-xl border transition-all ${
            isListening 
              ? "bg-rose-50 border-rose-400 text-rose-500 animate-pulse" 
              : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          }`}
          title="Voice Command Mode"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder={isListening ? "Listening closely..." : "Ask HERA AI..."}
          disabled={isListening}
          className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:bg-slate-50"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim()}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 font-medium text-sm shadow-sm"
        >
          Send
        </button>
      </div>

    </div>
  );
}