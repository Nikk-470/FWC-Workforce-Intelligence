import React from "react";
import { Shield, Award, CheckCircle, AlertTriangle, MessageSquare, ArrowLeft, Zap, Target, BookOpen } from "lucide-react";

export default function AIInterviewFeedbackView({ interviewData, onBack }) {
  // Translate 50-point score system into a standard percentage for UI meters
  const scorePercent = ((interviewData?.overallScore || 0) / 50) * 100;

  // Determine dynamic badge colors based on grading tiers
  const getScoreTierColor = (score) => {
    if (score >= 42) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 33) return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <div className="bg-slate-950 min-h-screen p-6 md:p-8 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 animate-fadeIn">
      
      {/* 🧭 NAVIGATION & HEADBOARD */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="text-xs font-black text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft size={14} /> BACK TO PIPELINE DIRECTORY
        </button>
        <div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
            AI Automated Telemetry Evaluation Node
          </span>
        </div>
      </div>

      {/* CORE HUB LAYOUT GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 📊 LEFT COLUMN: GRADED METRICS & RADIAL GAUGES */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* HIGH-LEVEL RADIAL OVERVIEW CARD */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl text-center flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-8 -mt-8" />
            
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">Aggregate Breakdown Matrix</h3>
            
            {/* CIRCULAR GRADIENT PERCENTAGE RING */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="url(#purpleGradient)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * scorePercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black tracking-tighter text-white">{interviewData?.overallScore || 0}</span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase border-t border-slate-800 pt-0.5 mt-0.5">OUT OF 50</span>
              </div>
            </div>

            <div className={`text-[11px] font-mono font-bold border px-3 py-1 rounded-full mt-2 ${getScoreTierColor(interviewData?.overallScore)}`}>
              TIER: {scorePercent >= 84 ? "OPTIMAL ARCHITECT" : scorePercent >= 66 ? "CORE SYSTEM FIT" : "DEVELOPMENT PROFILE"}
            </div>
          </div>

          {/* GRANULAR CRITERIA DIMENSION MATRICES */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Structural Multi-Track Vectors</h3>
            
            {[
              { label: "Technical Proficiency", val: interviewData?.technicalProficiency || 0, icon: <Zap size={13} className="text-amber-400" /> },
              { label: "Communication Clarity", val: interviewData?.communicationClarity || 0, icon: <MessageSquare size={13} className="text-sky-400" /> },
              { label: "Problem Solving Vector", val: interviewData?.problemSolving || 0, icon: <Target size={13} className="text-purple-400" /> },
              { label: "Domain Knowledge Edge", val: interviewData?.domainKnowledge || 0, icon: <BookOpen size={13} className="text-emerald-400" /> },
              { label: "Cultural Alignment Parameter", val: interviewData?.culturalFit || 0, icon: <Award size={13} className="text-rose-400" /> }
            ].map((metric, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-300 flex items-center gap-1.5">{metric.icon} {metric.label}</span>
                  <span className="font-mono font-bold text-white bg-slate-950 border border-slate-800/60 px-1.5 py-0.5 rounded">{metric.val}/10</span>
                </div>
                <div className="w-full bg-slate-950 border border-slate-800/80 h-2 p-0.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${metric.val * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* 📝 RIGHT COLUMN: STRATEGIC INSIGHT PANELS & COMPLETE DIALOG LOG */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* STRATEGIC ASSESSMENT TEXT SUMMARY BOX */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-4 font-mono text-[9px] font-black tracking-wider text-slate-600 uppercase">
              NLP SYNTAX SUMMARY
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Executive Summary Profile</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950 border border-slate-800/60 p-4 rounded-2xl">
              {interviewData?.summaryAssessment || "Assessment calculations compiling. Sync logs to process detailed semantic interpretation nodes."}
            </p>
          </div>

          {/* POSITIVE AND CONSTRUCTIVE INSIGHT MATRIX SPLIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* POSITIVES CARD */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-1.5">
                <CheckCircle size={14} /> Evaluation Assets Verified
              </h3>
              <div className="space-y-2.5">
                {interviewData?.feedbackMatrix?.positives?.map((item, idx) => (
                  <p key={idx} className="bg-slate-950 border border-slate-800/50 p-3 rounded-xl text-xs text-slate-300 font-medium leading-relaxed">
                    {item}
                  </p>
                )) || <p className="text-xs italic text-slate-600">No data records indexed.</p>}
              </div>
            </div>

            {/* GROWTHERNE/NEGATIVES CARD */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Recommended Growth Nodes
              </h3>
              <div className="space-y-2.5">
                {interviewData?.feedbackMatrix?.negatives?.map((item, idx) => (
                  <p key={idx} className="bg-slate-950 border border-slate-800/50 p-3 rounded-xl text-xs text-slate-300 font-medium leading-relaxed">
                    {item}
                  </p>
                )) || <p className="text-xs italic text-slate-600">No data records indexed.</p>}
              </div>
            </div>

          </div>

          {/* FULL TRANSCRIPT CONTEXT ACCORDION LAYER */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-800 pb-2">
              Comprehensive Dialogue Transcript Log
            </h3>
            <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
              {interviewData?.transcriptSummary?.map((message, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed border ${
                    message.speaker.includes("Candidate") 
                      ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-100 ml-auto" 
                      : "bg-slate-950 border-slate-800 text-slate-300"
                  }`}
                >
                  <span className="block font-black text-[9px] uppercase tracking-widest opacity-50 font-mono mb-1">
                    {message.speaker}
                  </span>
                  <p className="text-xs font-medium">"{message.text}"</p>
                </div>
              )) || (
                <p className="text-xs italic text-slate-600 text-center py-6">Conversation transcript context streams are currently empty.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER METADATA SECURITY PARAMS */}
      <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-600 font-mono">
        <span>REPORT_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        <span className="flex items-center gap-1"><Shield size={11} className="text-slate-500" /> SECURE AI ATTESTATION HUB</span>
      </div>

    </div>
  );
}