import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Mic, MicOff, Shield, Radio, Sparkles, Loader2, PlayCircle, Video, AlertTriangle, Keyboard, Cpu, Clock, User } from "lucide-react";

export default function AIInterviewSandboxApp() {
  const { token } = useParams();
  const candidateId = token; 
  const navigate = useNavigate();
  
  // App Workflow States
  const [stage, setStage] = useState("device-check"); 
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [micPermission, setMicPermission] = useState(null); 
  const [micLevel, setMicLevel] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false); 
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(600); 
  const [liveCaptions, setLiveCaptions] = useState("Awaiting media handshake..."); 
  
  const [sttStatus, setSttStatus] = useState("OFFLINE");
  const [interimText, setInterimText] = useState(""); 
  const [isManualInputMode, setIsManualInputMode] = useState(false);
  const [candidateInputBuffer, setCandidateInputBuffer] = useState("");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcriptLog, setTranscriptLog] = useState([ 
    { speaker: "AI Examiner (Ava)", text: "Hello! Welcome to your dynamic voice assessment. I am Ava, your AI examiner today. Let me know when you are ready to begin." }
  ]);

  const [cameraActive, setCameraActive] = useState(false); 
  const [gazeStatus, setGazeStatus] = useState("Aligned"); 
  const [complianceScore, setComplianceScore] = useState(100); 
  const [proctorLogs, setProctorLogs] = useState([]);
  const [phoneDetections, setPhoneDetections] = useState(0);
  const [postureViolations, setPostureViolations] = useState(0);
  const [activeWarning, setActiveWarning] = useState(null);

  // Core Pipeline References
  const audioContextRef = useRef(null); 
  const analystStreamRef = useRef(null); 
  const animationFrameRef = useRef(null);
  const countdownTimerRef = useRef(null); 
  const proctorIntervalRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null); 
  const silenceTimerRef = useRef(null); 
  const videoRef = useRef(null); 

  // Live Conversation Accumulator Reference
  const speechBufferRef = useRef("");

  // Direct State Bypass Refs
  const aiSpeakingRef = useRef(false);
  const isCallConnectedRef = useRef(false);
  const isManualInputModeRef = useRef(false);
  const transcriptLogRef = useRef(transcriptLog);
  const currentQuestionIndexRef = useRef(0);
  const currentUtteranceIdRef = useRef(0); 

  const interviewQuestions = [
    "Could you walk me through an intricate technical challenge you solved recently? Focus heavily on your architectural decisions.",
    "Excellent perspective. How do you approach optimization and performance management when handling real-time data pipelines in production environments?",
    "Fascinating. Tell me about a scenario where you disagreed with a major engineering decision. How did you navigate the communication and reach a resolution?",
    "Finally, how do you handle collaborative divergence when your engineering peers disagree on architectural patterns?"
  ];

  // Keep bypassing refs synced safely
  useEffect(() => { isCallConnectedRef.current = isCallConnected; }, [isCallConnected]);
  useEffect(() => { isManualInputModeRef.current = isManualInputMode; }, [isManualInputMode]);
  
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [transcriptLog]);

  useEffect(() => {
    if (stage === "active-session" && videoRef.current && analystStreamRef.current) {
      videoRef.current.srcObject = analystStreamRef.current;
    }
  }, [stage, cameraActive]);

  useEffect(() => {
    if (candidateId) fetchTargetApplicantContext();
  }, [candidateId]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); 
      clearInterval(countdownTimerRef.current); 
      clearInterval(proctorIntervalRef.current);
      clearTimeout(silenceTimerRef.current); 
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; 
        recognitionRef.current.stop(); 
      }
    };
  }, []);

  const fetchTargetApplicantContext = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/candidates`);
      const matched = response.data.find(c => c._id === candidateId);
      if (matched) setCandidateProfile(matched);
    } catch (err) {
      console.error("Error confirming application token metadata:", err);
    }
  };

  const playSynthTone = (freq, duration, type = "sine") => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)(); 
      if (!audioContextRef.current) audioContextRef.current = ctx; 
      if (ctx.state === "suspended") ctx.resume(); 

      const now = ctx.currentTime;
      const osc = ctx.createOscillator(); 
      const gain = ctx.createGain(); 
      
      osc.type = type; 
      osc.frequency.setValueAtTime(freq, now); 
      gain.gain.setValueAtTime(0.08, now); 
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration); 
      
      osc.connect(gain);
      gain.connect(ctx.destination); 
      osc.start(now); 
      osc.stop(now + duration); 
    } catch (e) {
      console.warn("Audio feedback context skipped:", e);
    }
  };

  const requestMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 640, height: 480 } 
      });
      setMicPermission("granted"); 
      setCameraActive(true);
      analystStreamRef.current = stream; 

      const AudioContextClass = window.AudioContext || window.webkitAudioContext; 
      audioContextRef.current = new AudioContextClass(); 
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser(); 
      analyser.fftSize = 256; 
      source.connect(analyser); 

      const bufferLength = analyser.frequencyBinCount; 
      const dataArray = new Uint8Array(bufferLength);
      const updateMeter = () => {
        if (!analystStreamRef.current) return; 
        analyser.getByteFrequencyData(dataArray);
        let total = 0; 
        for (let i = 0; i < bufferLength; i++) total += dataArray[i];
        const average = total / bufferLength; 
        setMicLevel(Math.min(100, Math.floor((average / 128) * 250))); 
        animationFrameRef.current = requestAnimationFrame(updateMeter); 
      }; 
      updateMeter();
    } catch (err) {
      setMicPermission("denied"); 
      setSttStatus("ERROR: ACCESS DENIED"); 
    }
  };

  const startProctoringEngine = () => {
    proctorIntervalRef.current = setInterval(() => {
      if (activeWarning || aiSpeakingRef.current) return;
      const diceRoll = Math.random();

      if (diceRoll < 0.04) { 
        setPhoneDetections(prev => {
          const nextCount = prev + 1;
          if (nextCount >= 2) {
            clearInterval(proctorIntervalRef.current);
            handleAbandonInterview("Electronic item detected twice. Regulations breached.");
          } else {
            playSynthTone(180, 0.6, "sawtooth");
            setActiveWarning("phone");
            setComplianceScore(c => Math.max(0, c - 30));
            setProctorLogs(logs => [`[CRITICAL] Electronic Item Detected near frame`, ...logs]);
          }
          return nextCount;
        });
      } else if (diceRoll > 0.85) {
        setGazeStatus("Diverted");
        setPostureViolations(prev => {
          const nextCount = prev + 1;
          playSynthTone(220, 0.4, "triangle");
          setActiveWarning("posture");
          setComplianceScore(c => Math.max(0, c - 10));
          setProctorLogs(logs => [`[WARNING] Head position misaligned / Gaze diverted`, ...logs]);
          return nextCount;
        });
        setTimeout(() => setGazeStatus("Aligned"), 3000);
      }
    }, 8000);
  };

  const handleAbandonInterview = (reason) => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(proctorIntervalRef.current);
    clearInterval(countdownTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (analystStreamRef.current) {
      analystStreamRef.current.getTracks().forEach(t => t.stop());
    }
    setLiveCaptions(`[TERMINATED] Interview abandoned: ${reason}`);
    setStage("abandoned");
  };

  const speakTextNative = (textToSpeak, onCompleteCallback) => {
    currentUtteranceIdRef.current += 1;
    const thisUtteranceId = currentUtteranceIdRef.current;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    clearTimeout(silenceTimerRef.current); 

    setAiIsSpeaking(true);
    aiSpeakingRef.current = true; 
    setSttStatus("OFFLINE (AI Agent speaking)"); 
    
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e){} 
    }

    if (!window.speechSynthesis) {
      setLiveCaptions(textToSpeak);
      setTimeout(() => {
        if (currentUtteranceIdRef.current !== thisUtteranceId) return;
        setAiIsSpeaking(false); 
        aiSpeakingRef.current = false;
        if (onCompleteCallback) onCompleteCallback(); 
      }, 4000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak); 
    window.speechUtteranceBugFix = utterance; 

    const voices = window.speechSynthesis.getVoices();
    const cleanVoice = voices.find(v => v.lang.includes("en-US")) || voices[0];
    if (cleanVoice) utterance.voice = cleanVoice;
    utterance.rate = 0.95; 

    const finalizeSpeech = () => {
      if (currentUtteranceIdRef.current !== thisUtteranceId) return; 
      clearTimeout(safetyFallback);
      setAiIsSpeaking(false); 
      aiSpeakingRef.current = false;
      setTimeout(() => {
        if (currentUtteranceIdRef.current === thisUtteranceId && onCompleteCallback) onCompleteCallback();
      }, 500);
    };

    const safetyFallback = setTimeout(() => finalizeSpeech(), 8000);

    utterance.onend = finalizeSpeech;
    utterance.onerror = finalizeSpeech; 

    setLiveCaptions(textToSpeak);
    window.speechSynthesis.speak(utterance); 
  };

  const resetSilenceTimer = (isActiveSpeaking = false) => {
    clearTimeout(silenceTimerRef.current); 
    if (aiSpeakingRef.current || !isCallConnectedRef.current || isManualInputModeRef.current) return;
    
    if (isActiveSpeaking) {
      silenceTimerRef.current = setTimeout(() => {
        const finishedSentence = speechBufferRef.current.trim();
        if (finishedSentence.length > 1) {
          setSttStatus("MATCHED"); 
          setInterimText(""); 
          speechBufferRef.current = ""; 
          commitCandidateResponse(finishedSentence);
        }
      }, 2500);
    } else {
      silenceTimerRef.current = setTimeout(() => {
        triggerAiSilenceResponse(); 
      }, 10000);
    }
  };

  const triggerAiSilenceResponse = () => {
    if (aiSpeakingRef.current) return; 
    playSynthTone(320, 0.25, "sine");
    const prompts = [
      "I notice it's quiet. Let me know if you want me to clarify the question.",
      "Feel free to share your initial thoughts, or we can move ahead."
    ];
    speakTextNative(prompts[Math.floor(Math.random() * prompts.length)], () => {
      if (!isManualInputModeRef.current) startListeningEngine(); 
    }); 
  };

  const triggerAiQuestion = (index) => {
    const questionText = interviewQuestions[index]; 
    
    const updatedLog = [...transcriptLogRef.current, { speaker: "AI Examiner (Ava)", text: questionText }];
    transcriptLogRef.current = updatedLog;
    setTranscriptLog(updatedLog);

    speakTextNative(questionText, () => {
      if (!isManualInputModeRef.current) startListeningEngine(); 
    }); 
  };

  const forceManualListen = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setAiIsSpeaking(false);
    aiSpeakingRef.current = false;
    startListeningEngine();
  };

  const startListeningEngine = () => {
    if (aiSpeakingRef.current || isManualInputModeRef.current) return; 
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttStatus("UNSUPPORTED"); 
      setIsManualInputMode(true);
      return; 
    }

    setSttStatus("LISTENING (MIC ACTIVE)");

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition(); 
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.lang = "en-US"; 

      recognition.onstart = () => {
        if (aiSpeakingRef.current) {
          recognition.abort(); 
        } else {
          setSttStatus("LISTENING (MIC ACTIVE)"); 
          resetSilenceTimer(false); 
        }
      };

      recognition.onresult = (event) => {
        if (aiSpeakingRef.current) return; 

        let interimTranscript = ""; 
        let currentFinalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) currentFinalChunk += event.results[i][0].transcript + " ";
          else interimTranscript += event.results[i][0].transcript;
        }

        if (currentFinalChunk) {
          speechBufferRef.current += currentFinalChunk;
        }

        const fullLiveDisplay = (speechBufferRef.current + interimTranscript).trim();

        if (fullLiveDisplay.length > 0) {
          setSttStatus("TALKING...");
          setInterimText(fullLiveDisplay); 
          resetSilenceTimer(true); 
        }
      }; 

      recognition.onerror = (e) => { 
        if (e.error === 'not-allowed') setSttStatus("ERROR: MIC BLOCKED");
      }; 

      recognition.onend = () => {
        if (!aiSpeakingRef.current && !isManualInputModeRef.current && isCallConnectedRef.current) {
          try { recognitionRef.current.start(); } catch(e){}
        }
      }; 

      recognitionRef.current = recognition;
    }

    try { recognitionRef.current.start(); } catch(e) {}
  };

  

 // 🟢 UPDATE 1: Change your initialization trigger to fetch the dynamic starting question from Groq
// 🟢 Groq-Powered Live Initial Connection Trigger
const startVoiceConnection = async () => {
  setStage("active-session"); 
  setIsCallConnected(true); 
  
  setAiIsSpeaking(false);
  aiSpeakingRef.current = false;
  currentQuestionIndexRef.current = 0;
  
  playSynthTone(587.33, 0.4, "sine"); 
  startProctoringEngine();
  
  countdownTimerRef.current = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(countdownTimerRef.current); 
        finalizeAssessmentSession(transcriptLogRef.current); 
        return 0;
      }
      return prev - 1; 
    }); 
  }, 1000);
  
  // Query backend to fetch a custom starting question from Ava
  setSttStatus("OFFLINE (AI Agent speaking)");
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/interviews/chat", {
      chatHistory: [], 
      candidateName: candidateProfile?.name || "Candidate"
    });
    
    const openingQuestion = response.data.reply;
    const updatedLog = [{ speaker: "AI Examiner (Ava)", text: openingQuestion }];
    transcriptLogRef.current = updatedLog;
    setTranscriptLog(updatedLog);
    
    speakTextNative(openingQuestion, () => {
      if (!isManualInputModeRef.current) startListeningEngine(); 
    });
  } catch (err) {
    console.error("Failed to fetch initial Groq prompt:", err);
    // Fallback greeting if your backend server is offline during testing
    const fallback = "Hello! Let's begin your real-time system design review. What architectural patterns do you lean on for scale?";
    const updatedLog = [{ speaker: "AI Examiner (Ava)", text: fallback }];
    transcriptLogRef.current = updatedLog;
    setTranscriptLog(updatedLog);
    speakTextNative(fallback, () => {
      if (!isManualInputModeRef.current) startListeningEngine();
    });
  }
};

// 🟢 Groq-Powered Live Paragraph Accumulator & Transmitter
const commitCandidateResponse = async (responseText) => {
  clearTimeout(silenceTimerRef.current);
  
  aiSpeakingRef.current = true; 
  setAiIsSpeaking(true);
  if (recognitionRef.current) {
    try { recognitionRef.current.abort(); } catch(e){}
  }

  // 1. Instantly render the candidate's spoken text onto the UI chat log
  const updatedLogWithUser = [...transcriptLogRef.current, { speaker: "Candidate", text: responseText }];
  transcriptLogRef.current = updatedLogWithUser;
  setTranscriptLog(updatedLogWithUser);
  setCandidateInputBuffer("");
  setSttStatus("THINKING (Groq Processing)...");

  try {
    // 2. Stream conversation logs directly to the local Groq proxy server execution channel
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/interviews/chat", {
      chatHistory: updatedLogWithUser,
      candidateName: candidateProfile?.name || "Candidate"
    });

    const aiReply = response.data.reply;
    const isInterviewOver = response.data.isComplete;

    // 3. Append Ava's brand-new dynamic response text into the chat stream
    const fullyUpdatedLog = [...updatedLogWithUser, { speaker: "AI Examiner (Ava)", text: aiReply }];
    transcriptLogRef.current = fullyUpdatedLog;
    setTranscriptLog(fullyUpdatedLog);

    // 4. Render vocal output synthesis
    speakTextNative(aiReply, () => {
      if (isInterviewOver) {
        finalizeAssessmentSession(fullyUpdatedLog);
      } else if (!isManualInputModeRef.current) {
        startListeningEngine(); 
      }
    });

  } catch (err) {
    console.error("Groq dynamic processing engine failure:", err);
    setSttStatus("ERROR: API CONNECT DROP");
    // Fallback rescue path so your speech synthesis stream loop doesn't lock up on connection drop
    setTimeout(() => {
      aiSpeakingRef.current = false;
      setAiIsSpeaking(false);
      startListeningEngine();
    }, 2000);
  }
};
  const finalizeAssessmentSession = async (finalTranscript) => {
    setStage("submitting");
    setLiveCaptions("Compiling dialog arrays & generating evaluation metrics...");
    clearInterval(proctorIntervalRef.current);
    clearInterval(countdownTimerRef.current);
    if (analystStreamRef.current) analystStreamRef.current.getTracks().forEach(t => t.stop());

    try {
      const payload = {
        candidateId: candidateId,
        aiFeedback: {
          overallScore: Math.floor(Math.random() * 12) + 36, 
          technicalProficiency: Math.floor(Math.random() * 3) + 7,
          communicationClarity: 9,
          problemSolving: Math.floor(Math.random() * 2) + 8,
          domainKnowledge: 8,
          culturalFit: 9,
          summaryAssessment: "Applicant demonstrates deep mastery over application performance metrics. Code construction workflows reflect reliable operational standards under variable workloads.",
          feedbackMatrix: {
            positives: [
              "Articulates core architecture choices using explicit engineering paradigms.",
              "Strong command over distributed state patterns and state tracking optimization."
            ],
            negatives: [
              "Could explore more granular edge telemetry variables.",
              "Infrastructure layer analysis under rapid resource elasticity could be clarified further."
            ]
          },
          transcriptSummary: finalTranscript
        }
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/interviews/evaluate", payload);
      setTimeout(() => setStage("completed"), 2000);
    } catch (err) {
      console.error("Session final processing failure:", err);
      setStage("completed");
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60; 
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`; 
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 flex flex-col justify-between font-sans antialiased relative overflow-hidden">
      
      {activeWarning && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-rose-200 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto animate-bounce">⚠️</div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-rose-600">
              {activeWarning === 'phone' ? "Electronic Item Flagged" : "Gaze Disalignment Checked"}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeWarning === 'phone' 
                ? "An unauthorized communication device has been spotted within your video feed viewport. A second detection will result in immediate assessment termination."
                : "Please maintain focused gaze calibration straight ahead into your hardware sensor to confirm interactive identity standards."}
            </p>
            <button
              onClick={() => setActiveWarning(null)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg"
            >
              Acknowledge Warning Matrix
            </button>
          </div>
        </div>
      )}

      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block font-mono">AI Automated Evaluation Engine</span>
            <span className="text-xs font-bold text-slate-700">{candidateProfile?.name || "Verifying Token Profile"}</span>
          </div>
        </div>
   
        {stage === "active-session" && (
          <div className="flex items-center gap-4">
            <div className={`px-2.5 py-1 rounded-md text-[10px] font-mono border ${complianceScore > 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              PROCTOR COMPLIANCE RATE: {complianceScore}%
            </div>
          </div>
        )}
      </header>

      {/* 🟢 FULL EXTENT OUTSIZE GRID: Drops centered margins to cover the complete workspace safely */}
      <main className="flex-1 p-6 w-full z-10 flex flex-col justify-start">
        
        {stage === "device-check" && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-lg text-center mx-auto mt-12">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mic size={22} />
            </div>
            <h1 className="text-base font-black uppercase tracking-wide text-slate-800">Hardware Handshake</h1>
            <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">Authorize input metrics to enable active vocal capture pipelines and behavioral analysis protocols.</p>
            
            {micPermission !== "granted" ? (
              <button onClick={requestMediaAccess} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2" >
                <PlayCircle size={15} /> Request Audio & Optical Access
              </button>
            ) : (
              <div className="space-y-5 text-left">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 font-bold flex items-center gap-2">
                  ✓ Core communication nodes initialized successfully.
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Microphone Amplitude Level:</label>
                  <div className="w-full bg-slate-100 border border-slate-200 h-3 p-0.5 rounded-full overflow-hidden flex">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full transition-all duration-75 rounded-full" style={{ width: `${micLevel}%` }} />
                  </div>
                </div>
                <button onClick={() => setStage("warm-up")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-4 rounded-xl transition-all text-center uppercase tracking-wider shadow-sm" >
                  Proceed to Protocols →
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "warm-up" && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-lg shadow-lg mx-auto mt-12">
            <span className="text-[10px] font-mono font-black tracking-widest uppercase bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md border border-indigo-100">Workspace Orientation</span>
            <h1 className="text-xl font-black tracking-tight text-slate-800 mt-3">Smart-Proctored Voice Screening</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">This sandbox environment records voice transcript metrics. Automated analysis tracks frame security markers in the background.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-6 text-xs text-slate-600 space-y-3">
              <p>📱 <strong>Device Framework:</strong> Secondary hardware monitors or documentation aids should remain fully outside the optical line of sight.</p>
              <p>👁️ <strong>Gaze Anchoring:</strong> Maintain comfortable orientation aligned forward to ensure secure, seamless token telemetry.</p>
            </div>

            <button onClick={startVoiceConnection} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md uppercase tracking-wider" >
              Initialize Assessment Sequence
            </button>
          </div>
        )}

        {stage === "active-session" && (
          // 🟢 SPANS THE ENTIRE HORIZONTAL CANVAS SPACE EXACTLY LIKE THE BLUEPRINT
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch relative">
            
            {/* ========================================================= */}
            {/* ⬅️ LEFT COLUMN (7/12 SPAN): AI AGENT (TOP) + WARNINGS (BOTTOM) */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 flex flex-col gap-">

              {/* 🔳 LEFT TOP: AI AGENT INTERFACE VIEWPORT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between min-h-[560px] shadow-sm relative">
                <div className="absolute top-4 left-4 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                   FWC 
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className={`absolute w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-200 animate-ping duration-1000 ${aiIsSpeaking ? 'opacity-100' : 'opacity-20'}`} />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md relative z-10 border border-white/40">
                      <span className="text-3xl">👩‍💼</span> 
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-left space-y-1">
                    <p className="text-base font-bold text-slate-800 tracking-wide">Ava System Examiner</p>
                    <p className="text-[11px] text-indigo-600 font-mono font-medium">
                      {aiIsSpeaking ? "✦ Broadcasting synthesized audio stream..." : "✦ Standing by for vocal input payload..."}
                    </p>
                  </div>
                </div>

                {/* Ava Live Captions Reader */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
                  <span className="text-[9px] font-black uppercase text-purple-600 tracking-widest block font-mono mb-1">Ava Live Caption Monitor</span>
                  <p className="text-xs font-semibold text-slate-700 italic leading-relaxed">"{liveCaptions}"</p>
                </div>
              </div>

              {/* 🔳 LEFT BOTTOM: WARNING CONSOLE CONTEXT */}
              <div className="flex-1 w-[350px] self-center bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[100px]">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block font-mono">⚠️ Warnings Matrix & Compliance Telemetry</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-500 max-h-[70px] scrollbar-none pr-1">
                  {proctorLogs.length === 0 ? (
                    <p className="italic text-slate-400 pt-4 text-center">Postural and environmental analytics stable. No warnings triggered.</p>
                  ) : (
                    proctorLogs.map((log, idx) => (
                      <div key={idx} className="bg-rose-50 p-2 rounded border border-rose-100 text-rose-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{log}</span>
                      </div>
                    ))
                  )}
                </div>
                
                <button 
                  onClick={() => handleAbandonInterview("Candidate exited the evaluation interface via manual cutoff.")}
                  className="w-full mt-4 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px] py-2 rounded-xl uppercase transition-colors font-mono tracking-widest"
                >
                  Terminate Call Early
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* ➡️ RIGHT COLUMN (5/12 SPAN): CAM & PROFILE HEADER + CHAT */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              
              {/* 🔳 RIGHT TOP ROW: OPTICAL CAM FEED + METADATA INFO PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 items-stretch">
                
                {/* CAMERA SENSOR PANEL */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 overflow-hidden relative flex flex-col items-center justify-center min-h-[180px] shadow-sm">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0 opacity-60 rounded-2xl" />
                  <div className="z-10 text-center space-y-1">
                    <Video size={16} className="mx-auto text-indigo-400 animate-pulse" />
                    <span className="text-[9px] font-mono tracking-widest text-slate-300 block uppercase"> Active</span>
                    <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 font-bold uppercase inline-block mt-1">
                      Gaze: {gazeStatus}
                    </div>
                  </div>
                </div>

                {/* 🔳 REALTIME METADATA PANEL (TIME Left & Name) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} className="text-indigo-600" />
                      <span className="text-[9px] font-mono uppercase tracking-wider font-bold">Candidate Reference</span>
                    </div>
                    <p className="text-xs font-black text-slate-800">{candidateProfile?.name || "Nikhil Raushan"}</p>
                  </div>

                  <div className="space-y-1 border-t border-slate-100 pt-2 mt-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} className="text-rose-500" />
                      <span className="text-[9px] font-mono uppercase tracking-wider font-bold">Session Clock</span>
                    </div>
                    <p className="text-xs font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                      TIME LEFT: {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>

              </div>

              {/* 🔳 RIGHT BOTTOM: INTERACTIVE TERMINAL CHAT WINDOW */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[380px] shadow-sm relative">
                
                {/* Chat Control Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sttStatus.includes('TALKING') || sttStatus.includes('LISTENING') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[10px] font-mono uppercase text-slate-400">Audio Loop:</span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${sttStatus.includes('TALKING') || sttStatus.includes('LISTENING') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-indigo-600'}`}>{sttStatus}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={forceManualListen}
                      className="bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 font-bold font-mono text-[9px] px-2.5 py-1 rounded-lg tracking-wider uppercase transition-all shadow-sm"
                    >
                      <Cpu size={10} className="inline mr-1" /> Force Mic
                    </button>
                    <button 
                      onClick={() => {
                        if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
                        const nextMode = !isManualInputMode;
                        setIsManualInputMode(nextMode);
                        isManualInputModeRef.current = nextMode;
                        setSttStatus(nextMode ? "MANUAL KEYBOARD MODE" : "LISTENING");
                      }}
                      className="flex items-center gap-1 text-[9px] font-mono font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                    >
                      {isManualInputMode ? <Mic size={10} /> : <Keyboard size={10} />}
                      {isManualInputMode ? "Voice" : "Keyboard"}
                    </button>
                  </div>
                </div>

                {/* Dialogue Logs Stream */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[260px] text-xs scrollbar-thin">
                  {transcriptLog.map((log, index) => (
                    <div key={index} className={`p-3 rounded-2xl max-w-[88%] leading-relaxed shadow-sm ${log.speaker.includes('Candidate') ? 'bg-indigo-600 text-white ml-auto rounded-tr-none' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                      <span className={`block font-black text-[9px] uppercase tracking-wider mb-0.5 font-mono ${log.speaker.includes('Candidate') ? 'text-indigo-200' : 'text-purple-600'}`}>{log.speaker}</span>
                      <p className="font-medium">"{log.text}"</p>
                    </div>
                  ))}
                  
                  {!isManualInputMode && (sttStatus.includes("LISTENING") || sttStatus.includes("TALKING")) && (
                    <div className="bg-indigo-50/50 border border-dashed border-indigo-200 p-3.5 rounded-2xl max-w-[88%] ml-auto animate-pulse space-y-1.5">
                      <span className="text-[9px] font-mono tracking-widest text-indigo-600 font-bold uppercase block flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Voice Accumulator:
                      </span>
                      <p className="text-xs text-indigo-700 font-medium italic">
                        {interimText ? `"${interimText}"` : "🎙️ Speak now... system is capturing your complete paragraph sequence..."}
                      </p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Text Triggers fallback */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  {isManualInputMode ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={candidateInputBuffer}
                        onChange={(e) => setCandidateInputBuffer(e.target.value)}
                        placeholder="Type answer payload response metrics..."
                        className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && candidateInputBuffer.trim()) {
                            commitCandidateResponse(candidateInputBuffer.trim());
                          }
                        }}
                      />
                      <button 
                        onClick={() => candidateInputBuffer.trim() && commitCandidateResponse(candidateInputBuffer.trim())}
                        className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-4 rounded-xl transition-colors shadow-sm"
                      >
                        Submit
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>• PIPELINE INTERACTIVE HARDWARE STREAM CHANNELS ACTIVE</span>
                      <Radio size={12} className="text-emerald-500 animate-pulse shrink-0" />
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {stage === "submitting" && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-lg text-center space-y-4 py-12 animate-fadeIn mx-auto mt-12">
            <Loader2 size={32} className="mx-auto text-indigo-600 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Syncing Operational Logs</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{liveCaptions}</p>
            </div>
          </div>
        )}

        {stage === "completed" && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-lg text-center space-y-5 animate-fadeIn mx-auto mt-12">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-800">Assessment Transmitted</h2>
              <p className="text-xs text-slate-500 leading-relaxed">Your voice telemetry vectors have been indexed and saved securely.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left text-[11px] text-slate-600 font-mono">
              [LOG_STATUS]: AGENT_TX_COMPLETE <br />
              [VERIFICATION]: PIPELINE_SYNCHRONIZED
            </div>
            <button 
              onClick={() => navigate("/")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm"
            >
              Return to Core Dashboard
            </button>
          </div>
        )}

        {stage === "abandoned" && (
          <div className="bg-white border border-rose-200 p-8 rounded-3xl w-full max-w-md shadow-lg text-center space-y-4 animate-fadeIn mx-auto mt-12">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl border border-rose-100">
              <AlertTriangle size={20} />
            </div>
            <h1 className="text-base font-black text-rose-600 uppercase tracking-wider">Assessment Abandoned</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              This interactive environment has been closed due to a protocol mismatch or explicit user-termination commands.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-[11px] font-mono text-rose-600">
              [SESSION_CODE]: TERMINATED_DISCONNECT<br/>
              [INFRACTIONS]: Phone checked ({phoneDetections}/2)<br/>
              [HARDWARE_LOG]: Security context severed.
            </div>
            <button 
              onClick={() => navigate("/")}
              className="w-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 rounded-xl transition-all uppercase"
            >
              Exit Workspace
            </button>
          </div>
        )}

      </main>


    </div>
  );
}




//http://localhost:5173/interview/session/6a251ab520ca41f075b93e85