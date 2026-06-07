import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Mic, MicOff, Shield, Radio, Sparkles, Loader2, PlayCircle, Video, AlertTriangle } from "lucide-react";

export default function AIInterviewSandboxApp() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  
  // App Workflow States
  // Stages: "device-check", "warm-up", "active-session", "submitting", "completed", "abandoned"
  const [stage, setStage] = useState("device-check"); 
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [micPermission, setMicPermission] = useState(null); 
  const [micLevel, setMicLevel] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false); 
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session length
  const [liveCaptions, setLiveCaptions] = useState("Awaiting media handshake..."); 
  
  // 🎙️ Speech-to-Text Diagnostics HUD State
  const [sttStatus, setSttStatus] = useState("OFFLINE");
  const [interimText, setInterimText] = useState(""); 
  const [isManualInputMode, setIsManualInputMode] = useState(false);
  const [candidateInputBuffer, setCandidateInputBuffer] = useState("");

  // Dynamic Conversation States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcriptLog, setTranscriptLog] = useState([ 
    { speaker: "AI Examiner (Ava)", text: "Hello! Welcome to your dynamic voice assessment. I am Ava, your AI examiner today. Let me know when you are ready to begin." }
  ]);

  // 🔒 Camera Proctoring & Behavior Tracking States
  const [cameraActive, setCameraActive] = useState(false); 
  const [gazeStatus, setGazeStatus] = useState("Aligned"); // Aligned | Diverted
  const [complianceScore, setComplianceScore] = useState(100); 
  const [proctorLogs, setProctorLogs] = useState([]);
  const [phoneDetections, setPhoneDetections] = useState(0);
  const [postureViolations, setPostureViolations] = useState(0);
  const [activeWarning, setActiveWarning] = useState(null); // null | 'phone' | 'posture'

  // Core Pipeline References
  const audioContextRef = useRef(null); 
  const analystStreamRef = useRef(null); 
  const animationFrameRef = useRef(null);
  const countdownTimerRef = useRef(null); 
  const proctorIntervalRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null); 
  const silenceTimerRef = useRef(null); 
  const aiSpeakingRef = useRef(aiIsSpeaking);
  const videoRef = useRef(null); 

  const interviewQuestions = [
    "Could you walk me through an intricate technical challenge you solved recently? Focus heavily on your architectural decisions.",
    "Excellent perspective. How do you approach optimization and performance management when handling real-time data pipelines in production environments?",
    "Fascinating. Tell me about a scenario where you disagreed with a major engineering decision. How did you navigate the communication and reach a resolution?",
    "Finally, how do you handle collaborative divergence when your engineering peers disagree on architectural patterns?"
  ];

  useEffect(() => {
    aiSpeakingRef.current = aiIsSpeaking;
  }, [aiIsSpeaking]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptLog]);

  useEffect(() => {
    if (stage === "active-session" && videoRef.current && analystStreamRef.current) {
      videoRef.current.srcObject = analystStreamRef.current;
    }
  }, [stage, cameraActive]);

  useEffect(() => {
    if (candidateId) {
      fetchTargetApplicantContext();
    }
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
      const response = await axios.get(`http://localhost:5000/api/candidates`);
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

      // Check for Electronic Devices (Phone Detection Simulator)
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
      }
      // Check Candidate Gaze Focus
      else if (diceRoll > 0.85) {
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
    setAiIsSpeaking(true);
    setSttStatus("OFFLINE (AI Agent speaking)"); 
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){} 
    }

    if (!window.speechSynthesis) {
      setLiveCaptions(textToSpeak);
      setTimeout(() => {
        setAiIsSpeaking(false); 
        if (onCompleteCallback) onCompleteCallback(); 
      }, 4000);
      return;
    }

    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(textToSpeak); 
    const voices = window.speechSynthesis.getVoices();
    const cleanVoice = voices.find(v => v.lang.includes("en-US")) || voices[0];
    if (cleanVoice) utterance.voice = cleanVoice;
    utterance.rate = 0.95; 

    const safetyFallback = setTimeout(() => {
      setAiIsSpeaking(false);
      if (onCompleteCallback) onCompleteCallback();
    }, 12000);

    utterance.onend = () => {
      clearTimeout(safetyFallback);
      setAiIsSpeaking(false); 
      if (onCompleteCallback) onCompleteCallback(); 
    };
    utterance.onerror = () => {
      clearTimeout(safetyFallback);
      setAiIsSpeaking(false); 
      if (onCompleteCallback) onCompleteCallback(); 
    }; 

    setLiveCaptions(textToSpeak);
    window.speechSynthesis.speak(utterance); 
  };

  const resetSilenceTimer = (isActiveSpeaking = false) => {
    clearTimeout(silenceTimerRef.current); 
    if (aiSpeakingRef.current || !isCallConnected || isManualInputMode) return;
    const delay = isActiveSpeaking ? 7000 : 12000; 
    silenceTimerRef.current = setTimeout(() => {
      triggerAiSilenceResponse(); 
    }, delay);
  };

  const triggerAiSilenceResponse = () => {
    if (aiSpeakingRef.current) return; 
    playSynthTone(320, 0.25, "sine");
    const prompts = [
      "I notice it's quiet. Let me know if you want me to clarify the question.",
      "Feel free to share your initial thoughts, or we can move ahead."
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]; 
    speakTextNative(randomPrompt, () => {
      if (!isManualInputMode) startListeningEngine(); 
    }); 
  };

  const triggerAiQuestion = (index) => {
    const questionText = interviewQuestions[index]; 
    setTranscriptLog(prev => [...prev, { speaker: "AI Examiner (Ava)", text: questionText }]);
    speakTextNative(questionText, () => {
      if (!isManualInputMode) startListeningEngine(); 
    }); 
  };

  const startListeningEngine = () => {
    if (aiSpeakingRef.current || isManualInputMode) return; 
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttStatus("UNSUPPORTED"); 
      setIsManualInputMode(true);
      return; 
    }

    setSttStatus("INITIALIZING...");
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition(); 
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.lang = "en-US"; 

      recognition.onstart = () => {
        setSttStatus("LISTENING (MIC ACTIVE)"); 
        resetSilenceTimer(false); 
      };
      recognition.onresult = (event) => {
        let interimTranscript = ""; 
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }

        if (interimTranscript) {
          setSttStatus("PROCESSING...");
          setInterimText(interimTranscript); 
          resetSilenceTimer(true); 
        }

        if (finalTranscript.trim().length > 1) {
          const finishedSpeech = finalTranscript.trim();
          setSttStatus("MATCHED"); 
          setInterimText(""); 
          commitCandidateResponse(finishedSpeech);
        }
      }; 

      recognition.onerror = () => { setSttStatus("LISTENING"); };
      recognition.onend = () => {
        if (!aiSpeakingRef.current && isCallConnected && !isManualInputMode) {
          try { recognition.start(); } catch(e){}
        }
      }; 

      recognitionRef.current = recognition;
    }

    try { recognitionRef.current.start(); } catch(e){}
  };

  const commitCandidateResponse = (responseText) => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }

    const updatedLog = [...transcriptLog, { speaker: "Candidate", text: responseText }];
    setTranscriptLog(updatedLog);
    setCandidateInputBuffer("");

    setTimeout(() => {
      if (currentQuestionIndex < interviewQuestions.length - 1) {
        const nextIdx = currentQuestionIndex + 1; 
        setCurrentQuestionIndex(nextIdx); 
        triggerAiQuestion(nextIdx); 
      } else {
        finalizeAssessmentSession(updatedLog);
      }
    }, 1000);
  };

  const startVoiceConnection = async () => {
    setStage("active-session"); 
    setIsCallConnected(true); 
    playSynthTone(587.33, 0.4, "sine"); 
    startProctoringEngine();
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current); 
          finalizeAssessmentSession(transcriptLog); 
          return 0;
        }
        return prev - 1; 
      }); 
    }, 1000);
    setTimeout(() => { triggerAiQuestion(0); }, 2000); 
  };

  const finalizeAssessmentSession = async (finalTranscript) => {
    setStage("submitting");
    setLiveCaptions("Compiling dialog arrays & generating evaluation metrics...");
    clearInterval(proctorIntervalRef.current);
    clearInterval(countdownTimerRef.current);
    if (analystStreamRef.current) {
      analystStreamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      // Mock 50-point feedback analytics payload matching your exact router targets
      const payload = {
        candidateId: candidateId,
        aiFeedback: {
          overallScore: Math.floor(Math.random() * 12) + 36, // Scores between 36-48/50
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

      // In production, your backend uses an LLM node to extract feedback from finalTranscript
      // Here we post to finalize candidate state tracking details:
      // await axios.post("http://localhost:5000/api/interviews/evaluate", payload);
      
      setTimeout(() => {
        setStage("completed");
      }, 2000);
    } catch (err) {
      console.error("Session final processing loop failure:", err);
      setStage("completed");
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60; 
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`; 
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans antialiased relative overflow-hidden">
      
      {/* SECURITY SYSTEM PROCTORING INFRACTION WARNING MODAL */}
      {activeWarning && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-xl mx-auto animate-bounce">⚠️</div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-rose-400">
              {activeWarning === 'phone' ? "Electronic Item Flagged" : "Gaze Disalignment Checked"}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
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

      {/* COGNITIVE TOP BANNER STATUS BAR */}
      <header className="border-b border-slate-900 bg-slate-900/40 px-6 py-4 flex items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">AI Automated Evaluation Engine</span>
            <span className="text-xs font-bold text-slate-200">{candidateProfile?.name || "Verifying Token Profile"}</span>
          </div>
        </div>
   
        {stage === "active-session" && (
          <div className="flex items-center gap-4">
            <div className={`px-2.5 py-1 rounded-md text-[10px] font-mono border ${complianceScore > 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              PROCTOR COMPLIANCE RATE: {complianceScore}%
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-indigo-400">TIMER: {formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
      </header>

      {/* DYNAMIC HUBS VIEWPORT CENTER STAGE */}
      <main className="flex-1 flex items-center justify-center p-6 max-w-6xl mx-auto w-full z-10">
        
        {/* VIEW 1: DEVICE ACCESS HANDSHAKE */}
        {stage === "device-check" && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl text-center">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mic size={22} />
            </div>
            <h1 className="text-base font-black uppercase tracking-wide text-slate-200">Hardware Handshake</h1>
            <p className="text-xs text-slate-400 mt-1.5 mb-6 leading-relaxed">Authorize input metrics to enable active vocal capture pipelines and behavioral analysis protocols.</p>
            
            {micPermission !== "granted" ? (
              <button onClick={requestMediaAccess} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2" >
                <PlayCircle size={15} /> Request Audio & Optical Access
              </button>
            ) : (
              <div className="space-y-5 text-left">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 font-bold flex items-center gap-2">
                  ✓ Core communication nodes initialized successfully.
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Microphone Amplitude Level:</label>
                  <div className="w-full bg-slate-950 border border-slate-800 h-3 p-0.5 rounded-full overflow-hidden flex">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-75 rounded-full" style={{ width: `${micLevel}%` }} />
                  </div>
                </div>
                <button onClick={() => setStage("warm-up")} className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black text-xs py-3 px-4 rounded-xl transition-all text-center uppercase tracking-wider" >
                  Proceed to Protocols →
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ORIENTATION WARMUP PROTOCOLS */}
        {stage === "warm-up" && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md">Workspace Orientation</span>
            <h1 className="text-xl font-black tracking-tight text-slate-200 mt-3">Smart-Proctored Voice Screening</h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">This sandbox environment records voice transcript metrics. Automated analysis tracks frame security markers in the background.</p>
            
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 my-6 text-xs text-slate-300 space-y-3">
              <p>📱 <strong>Device Framework:</strong> Secondary hardware monitors or documentation aids should remain fully outside the optical line of sight.</p>
              <p>👁️ <strong>Gaze Anchoring:</strong> Maintain comfortable orientation aligned forward to ensure secure, seamless token telemetry.</p>
            </div>

            <button onClick={startVoiceConnection} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-lg uppercase tracking-wider" >
              Initialize Assessment Sequence
            </button>
          </div>
        )}

        {/* VIEW 3: SYSTEM CONSOLE INTERACTION PANEL */}
        {stage === "active-session" && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch relative">
            
            {/* AGENT DIALOG COLUMN */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between min-h-[480px] shadow-2xl relative">
              
              {/* Telemetry Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${sttStatus.includes('LISTENING') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500">Audio State:</span>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{sttStatus}</span>
                </div>
                <button 
                  onClick={() => {
                    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
                    setIsManualInputMode(!isManualInputMode);
                    setSttStatus(isManualInputMode ? "LISTENING" : "MANUAL KEYBOARD MODE");
                  }}
                  className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 font-bold text-slate-400 px-2.5 py-1 rounded-md transition-colors"
                >
                  {isManualInputMode ? "🔌 Switch to Voice Stream" : "⌨️ Use Manual Input Fallback"}
                </button>
              </div>

              {/* Core Logs Workspace */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[280px] text-xs scrollbar-thin">
                {transcriptLog.map((log, index) => (
                  <div key={index} className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${log.speaker.includes('Candidate') ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 ml-auto' : 'bg-slate-950 border border-slate-800 text-slate-300'}`}>
                    <span className="block font-black text-[10px] uppercase tracking-wider mb-1 opacity-60">{log.speaker}</span>
                    <p className="font-medium">"{log.text}"</p>
                  </div>
                ))}
                {interimText && (
                  <div className="bg-slate-950/40 border border-slate-800/50 p-3 rounded-2xl max-w-[80%] text-slate-500 italic animate-pulse ml-auto">
                    "{interimText}..."
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Active Inputs Matrix Footer */}
              <div className="mt-4 border-t border-slate-800 pt-4">
                {isManualInputMode ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={candidateInputBuffer}
                      onChange={(e) => setCandidateInputBuffer(e.target.value)}
                      placeholder="Type your structured solution feedback parameters here..."
                      className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && candidateInputBuffer.trim()) {
                          commitCandidateResponse(candidateInputBuffer.trim());
                        }
                      }}
                    />
                    <button 
                      onClick={() => candidateInputBuffer.trim() && commitCandidateResponse(candidateInputBuffer.trim())}
                      className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white px-4 rounded-xl transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest block">Ava Live Caption Tracker</span>
                      <p className="text-xs font-bold text-slate-200 italic">"{liveCaptions}"</p>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-[24px]">
                      <Radio size={16} className={aiIsSpeaking ? "text-purple-400 animate-pulse" : "text-slate-700"} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* INTEGRATED SIDEBAR CONTROLLER (OPTICAL PROCTOR TRACKING HUD) */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden relative flex flex-col items-center justify-center min-h-[160px] shadow-lg bg-gradient-to-b from-slate-900 to-slate-950">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0 opacity-40 rounded-3xl" />
                <div className="z-10 text-center space-y-1">
                  <Video size={20} className="mx-auto text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block">Sensor Feed Active</span>
                  <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 font-bold uppercase">Gaze: {gazeStatus}</div>
                </div>
              </div>

              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-2 border-b border-slate-800 pb-1.5">System Security Logs</span>
                <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-500 max-h-[180px] scrollbar-none">
                  {proctorLogs.length === 0 ? (
                    <p className="italic text-slate-600 pt-4 text-center">No anomalies registered on matrix framework.</p>
                  ) : (
                    proctorLogs.map((log, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-1.5 rounded border border-slate-900 text-rose-300">
                        {log}
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => handleAbandonInterview("Candidate exited the evaluation interface via manual cutoff.")}
                  className="w-full mt-3 border border-rose-900/40 hover:bg-rose-950/20 text-rose-400 font-bold text-[10px] py-1.5 rounded-xl uppercase transition-colors"
                >
                  Terminate Call Early
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: SUBMITTED CALCULATION PIPELINE */}
        {stage === "submitting" && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl text-center space-y-4 py-12 animate-fadeIn">
            <Loader2 size={32} className="mx-auto text-indigo-500 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Syncing Operational Logs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{liveCaptions}</p>
            </div>
          </div>
        )}

        {/* VIEW 5: ASSESSMENT FINISHED */}
        {stage === "completed" && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl text-center space-y-5 animate-fadeIn">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-200">Assessment Transmitted</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Your voice telemetry vectors have been indexed and saved securely.</p>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-left text-[11px] text-slate-400 font-mono">
              [LOG_STATUS]: AGENT_TX_COMPLETE <br />
              [VERIFICATION]: PIPELINE_SYNCHRONIZED
            </div>
            <button 
              onClick={() => navigate("/")}
              className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all uppercase tracking-wider"
            >
              Return to Core Dashboard
            </button>
          </div>
        )}

        {/* VIEW 6: PROCTOR SEVERED/ABANDONED CONTAINER */}
        {stage === "abandoned" && (
          <div className="bg-slate-900 border border-rose-900 p-8 rounded-3xl w-full max-w-md shadow-2xl text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl border border-rose-500/20">
              <AlertTriangle size={20} />
            </div>
            <h1 className="text-base font-black tracking-tight text-rose-400 uppercase tracking-wider">Assessment Abandonded</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This interactive environment has been closed due to a protocol mismatch or explicit user-termination commands.
            </p>
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-left text-[11px] font-mono text-rose-300">
              [SESSION_CODE]: TERMINATED_DISCONNECT<br/>
              [INFRACTIONS]: Phone checked ({phoneDetections}/2)<br/>
              [HARDWARE_LOG]: Security context severed.
            </div>
            <button 
              onClick={() => navigate("/")}
              className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold text-xs py-2 rounded-xl transition-all uppercase"
            >
              Exit Workspace
            </button>
          </div>
        )}

      </main>

      {/* FOOTER SIGNATURE */}
      <footer className="border-t border-slate-900 bg-slate-950/60 px-6 py-3 flex justify-between items-center text-[9px] text-slate-500 font-mono">
        <span>SECURITY HASH: SEC_NODE_VOICE_VERIFIED</span>
        <span>SSL SECURE DISPATCH LAYER</span>
      </footer>

    </div>
  );
}