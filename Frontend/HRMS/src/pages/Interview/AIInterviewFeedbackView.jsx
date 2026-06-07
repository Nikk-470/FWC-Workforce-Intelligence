import React from "react";

export default function AIInterviewFeedbackView({ interviewData, onBack }) {
  const scorePercent = ((interviewData?.overallScore || 0) / 50) * 100;

  return (
    <div className="bg-slate-50 min-h-screen p-6 md:p-8 text-slate-800">
      
      {/* Navigation Row */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
        >
          ← Back to Pipeline Directory
        </button>
        <div>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
            AI Voice Screening Evaluation Log
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Stats Column */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Overall AI Score</p>
            
            <div className="my-6 text-5xl font-black text-slate-900 tracking-tight">
              {interviewData?.overallScore}
              <span className="text-xl font-medium text-slate-400">/50</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
              <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${scorePercent}%` }} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">{interviewData?.candidateName}</h3>
            <p className="text-xs text-indigo-600 font-semibold bg-indigo-50 inline-block px-3 py-1 rounded-lg mt-1">
              {interviewData?.targetRole}
            </p>

            <hr className="my-5 border-slate-100" />

            <div className="text-left space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Session Date:</span>
                <span className="font-medium text-slate-800">{interviewData?.matchDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-medium text-slate-800">{interviewData?.callDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voice Profile:</span>
                <span className="font-medium text-slate-800 truncate max-w-[150px]">{interviewData?.voiceToneUsed}</span>
              </div>
            </div>
          </div>

          {/* Context Metrics */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Skill Targets</h4>
              <div className="flex flex-wrap gap-1.5">
                {interviewData?.extractedContext?.skillsVerified?.map((skill, idx) => (
                  <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-xl text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Feedback Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Positives */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 mb-4">🟢 Positive Evaluation Insights</h3>
            <div className="space-y-3">
              {interviewData?.feedbackMatrix?.positives?.map((item, idx) => (
                <p key={idx} className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-xl text-xs text-slate-700 leading-relaxed">
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Negatives */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
            <h3 className="text-base font-bold text-slate-900 mb-4">🟡 Constructive Growth Areas</h3>
            <div className="space-y-3">
              {interviewData?.feedbackMatrix?.negatives?.map((item, idx) => (
                <p key={idx} className="bg-amber-50/40 border border-amber-100 p-3 rounded-xl text-xs text-slate-700 leading-relaxed">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}