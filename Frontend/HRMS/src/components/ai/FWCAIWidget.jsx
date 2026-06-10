import { useState, useEffect, useRef } from "react";
import { Bot, X } from "lucide-react";
import axios from "axios";

export default function FWCAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const actions = {
    "Generate Workforce Report":
      "Workforce Report Generated. Total Employees: 5247, Attendance: 98.4%, Open Positions: 324.",
  
    "Attendance Insights":
      "Attendance rate is currently 98.4%. Two attendance anomalies detected this month.",
  
    "Employee Analytics":
      "Total Employees: 5247. Top performing department: Engineering.",
  
    "Workforce Risk Analysis":
      "12 employees have been identified as potential attrition risks.",
  };
  
  const recruiterActions = {
    "Show Shortlisted Candidates":
      "Show shortlisted candidates",
  
    "Top Scoring Candidates":
      "Show candidates with highest scores",
  
    "React Developers":
      "Show candidates with React skills",
  
    "Hiring Summary":
      "Give hiring summary",
  };

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Nikhil 👋 How can I help you today?",
    },
  ]);

  // Initialize Speech-to-Text Recognition Hook
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel(); // Interrupt existing playback
    };

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      if (spokenText.trim()) {
        executeMessageSend(spokenText);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  // Text-to-Speech Vocalization Utility
  const speakResponse = (textToSpeak) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Clear current voice queue

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to lock down a premium standard English vocal profile
    const targetVoice = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Female") || v.lang.includes("en-US")
    );
    if (targetVoice) utterance.voice = targetVoice;

    window.speechSynthesis.speak(utterance);
  };

  const getRole = () => {
    const path = window.location.pathname;
  
    if (path.includes("/admin")) return "admin";
    if (path.includes("/recruiter")) return "recruiter";
    if (path.includes("/employee")) return "employee";
    if (path.includes("/seniormanager")) return "seniorManager";
  
    return "admin";
  };

  // Central Core Submission Handler supporting Voice and Typing pipeline
  const executeMessageSend = async (textToSend) => {
    if (!textToSend.trim()) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
  
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: textToSend,
      },
    ]);
  
    setInput("");
  
    try {
      const response = await axios.post(
        "Frontend/HRMS/src/**/api/fwcai",
        {
          role: getRole(),
          message: textToSend,
        }
      );
  
      const replyText = response.data.reply;
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: replyText,
        },
      ]);
      speakResponse(replyText); // Read backend response out loud
  
    } catch (error) {
      const errorText = "Server connection failed.";
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: errorText,
        },
      ]);
      speakResponse(errorText);
    }
  };

  const handleSendMessage = () => {
    executeMessageSend(input);
  };

  const handleSuggestion = (question, answer) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: question,
      },
      {
        sender: "ai",
        text: answer,
      },
    ]);
  
    speakResponse(answer); // Read standard local widget answer actions out loud

    setRecentSearches((prev) => {
      const updated = [
        question,
        ...prev.filter((item) => item !== question),
      ];
  
      return updated.slice(0, 3);
    });
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return alert("Speech recognition is not supported on this browser version.");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          ref={popupRef}
          className={`
            fixed
            bottom-24
            right-4
            sm:right-6
            bg-white
            rounded-3xl
            shadow-2xl
            border
            border-slate-200
            z-50
            overflow-hidden
            flex flex-col
            ${
              isExpanded
                ? "w-[90vw] sm:w-[650px] h-[80vh]"
                : "w-[90vw] sm:w-96 h-[70vh]"
            }
          `}
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
            <div>
              <h2 className="font-bold">
                FWCAI Assistant
              </h2>
              <p className="text-xs opacity-80">
                Online
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsExpanded(!isExpanded)}>
                ⛶
              </button>

              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Container */}
          <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">

            {/* Scrollable Messages Panel */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl text-sm ${
                    message.sender === "user"
                      ? "bg-indigo-600 text-white ml-8 rounded-tr-none shadow-sm"
                      : "bg-slate-100 mr-8 rounded-tl-none border border-slate-50"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            {/* Quick Menu Options Overlay */}
            {showMenu && (
              <div className="bg-slate-50 rounded-2xl p-4 max-h-48 overflow-y-auto border border-slate-100 shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-slate-800">
                    Quick Menu
                  </h3>

                  <button
                    onClick={() => setShowMenu(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Recent Searches */}
                <div className="space-y-1.5 mb-3">
                  {recentSearches.length === 0 ? (
                    <div className="text-slate-400 text-xs pl-0.5">
                      No recent searches
                    </div>
                  ) : (
                    recentSearches.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestion(item, actions[item])}
                        className="bg-white p-2 text-xs rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-200/60"
                      >
                        {item}
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Actions List */}
                <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                  Quick Actions
                </h4>

                <div className="space-y-1.5">
                  <div
                    onClick={() => handleSuggestion("Generate Workforce Report", actions["Generate Workforce Report"])}
                    className="bg-white p-2 text-xs rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-200/60"
                  >
                    📄 Generate Workforce Report
                  </div>

                  <div
                    onClick={() => handleSuggestion("Attendance Insights", actions["Attendance Insights"])}
                    className="bg-white p-2 text-xs rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-200/60"
                  >
                    📊 Attendance Insights
                  </div>

                  <div
                    onClick={() => handleSuggestion("Employee Analytics", actions["Employee Analytics"])}
                    className="bg-white p-2 text-xs rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-200/60"
                  >
                    👥 Employee Analytics
                  </div>

                  <div
                    onClick={() => handleSuggestion("Workforce Risk Analysis", actions["Workforce Risk Analysis"])}
                    className="bg-white p-2 text-xs rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-200/60"
                  >
                    ⚠ Workforce Risk Analysis
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Input Dashboard Frame */}
            <div className="flex flex-col gap-1 shrink-0 pt-1">
              {isListening && (
                <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1.5 pl-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Listening closely...
                </div>
              )}

              <div className="flex gap-2 items-center">
                {!showMenu && (
                  <button
                    onClick={() => setShowMenu(true)}
                    className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm transition-colors"
                  >
                    ☰
                  </button>
                )}

                {/* Voice Integration Microphone Activation Button */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                    isListening
                      ? "bg-rose-50 border-rose-400 text-rose-500 animate-pulse"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                  title={isListening ? "Stop Listening" : "Speak to FWCAI"}
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
                  placeholder={isListening ? "Listening..." : "Ask FWCAI..."}
                  disabled={isListening}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/80 transition-all disabled:bg-slate-50 placeholder-slate-400 text-slate-700"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isListening}
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 text-sm"
                >
                  ➤
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Node Entry Action Point */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            if (isOpen && window.speechSynthesis) window.speechSynthesis.cancel();
            setIsOpen(!isOpen);
          }}
          className="w-16 h-16 rounded-full bg-indigo-600 text-white shadow-2xl hover:scale-105 transition-all flex items-center justify-center"
        >
          <Bot size={30} />
        </button>

        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </div>
    </>
  );
}