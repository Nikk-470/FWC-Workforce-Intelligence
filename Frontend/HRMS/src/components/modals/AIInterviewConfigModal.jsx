import React, { useState } from "react";
import axios from "axios";
import { Brain, Sliders, Calendar, Clock, AlertTriangle, PlayCircle } from "lucide-react";

export default function AIInterviewConfigModal({ candidate, onClose, onDeploymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [configData, setConfigData] = useState({
    date: "",
    type: "Technical Assessment Round",
    focusSkills: "React, Node.js, Database Design, System Architecture",
    difficulty: "Mid-Level",
    duration: "15 Minutes"
  });

  const handleDeployAssessment = async (e) => {
    e.preventDefault();
    if (!configData.date) {
      alert("Please select a target execution date time slot.");
      return;
    }
    
    setLoading(true);
    try {
      // 🟢 SAFE TIMESTAMP DECONSTRUCTION: Parse "YYYY-MM-DDTHH:MM" smoothly
      const [parsedDate, parsedTime] = configData.date.split("T");

      const res = await axios.post("http://localhost:5000/api/interviews/schedule", {
  // 🟢 1. Top-Level Identity Fields (Fixes the 400 error!)
  candidateId: candidate._id,
  name: candidate.name,
  email: candidate.email,
  jobId: candidate.jobId || null,
  mode: "ai",

  // 🟢 2. Custom Engine Config Trackers
  time: parsedTime || "10:00",
  difficulty: configData.difficulty,
  duration: configData.duration,
  focusSkills: configData.focusSkills,

  // 🟢 3. Nested Object Structure (Matches backend destructuring!)
  interviewDetails: {
    date: parsedDate, // "YYYY-MM-DD"
    type: `${configData.type} (${configData.difficulty})`,
    link: `http://localhost:5173/interview/session/${candidate._id}` // Aligned with your system route mapping (/:token)
  }
});

      if (res.data?.success) {
        alert(`AI Examination engine queued successfully. Alert email dispatched to ${candidate.name}.`);
        if (onDeploymentSuccess) onDeploymentSuccess();
      }
    } catch (err) {
      console.error("AI Deployment handler failure:", err);
      alert("Failed to queue assessment configurations onto server nodes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex gap-3 text-left">
        <Brain className="text-purple-600 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider">Automated Matrix Configuration</h4>
          <p className="text-[11px] text-purple-700 leading-relaxed">
            This module launches an isolated voice environment. The system records speech transcripts and processes a comprehensive <strong>50-Point Feedback Report</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={handleDeployAssessment} className="space-y-4 text-xs text-left">
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-500">Assessment Difficulty Matrix</label>
          <div className="grid grid-cols-3 gap-2">
            {["Junior", "Mid-Level", "Senior"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setConfigData({ ...configData, difficulty: level })}
                className={`py-2 px-3 border rounded-xl font-bold transition-all text-center ${
                  configData.difficulty === level 
                    ? "border-purple-600 bg-purple-50 text-purple-700" 
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-500 mb-1">Target Expiration Date</label>
            <input 
              type="datetime-local" 
              required 
              value={configData.date} 
              onChange={(e) => setConfigData({ ...configData, date: e.target.value })} 
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-500 font-medium bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800" 
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">Session Duration</label>
            <select 
              value={configData.duration} 
              onChange={(e) => setConfigData({ ...configData, duration: e.target.value })} 
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-500 bg-white font-medium text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
            >
              <option>10 Minutes</option>
              <option>15 Minutes</option>
              <option>20 Minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-500 mb-1">Target Core Focus Skills (Comma Separated)</label>
          <input 
            type="text" 
            value={configData.focusSkills} 
            onChange={(e) => setConfigData({ ...configData, focusSkills: e.target.value })} 
            placeholder="e.g. React, Docker, Architecture" 
            className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-500 font-medium bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800" 
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950 rounded-xl font-bold text-slate-600 dark:text-slate-400"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-black shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <PlayCircle size={14} />
            {loading ? "Deploying Hub Node..." : "Confirm & Send AI Invite"}
          </button>
        </div>
      </form>
    </div>
  );
}