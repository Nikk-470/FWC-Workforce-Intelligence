import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from "@/layouts/DashboardLayout";
import AIInterviewConfigModal from "@/components/modals/AIInterviewConfigModal";

export default function JobPipelineDetails() {
  const { jobId } = useParams(); 
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 CONTROLLING STATES FOR INLINE SCHEDULING
  const [schedulingCandidate, setSchedulingCandidate] = useState(null);
  const [schedulingType, setSchedulingType] = useState(null); // 'choose', 'live', or 'ai'
  const [schedulingMode, setSchedulingMode] = useState("table"); // "table" or "configure"

  // 🟢 NEW STATE FOR REVIEWING COMPLETED AI FEEDBACK MODALS
  const [activeFeedbackCandidate, setActiveFeedbackCandidate] = useState(null);

  // 🟢 HUMAN SCHEDULER PARAMETER FORM STATES
  const [interviewType, setInterviewType] = useState("Technical Round");
  const [interviewDate, setInterviewDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🟢 EXPLICIT RE-USABLE DISPATCH PIPELINE RETRIEVER
  const fetchPipelineData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, candidatesRes] = await Promise.all([
        axios.get("Frontend/HRMS/src/**/api/jobs"),
        axios.get("Frontend/HRMS/src/**/api/candidates")
      ]);

      const currentJob = jobsRes.data?.find(j => j._id === jobId);
      setJob(currentJob || { title: "wew", department: "General", location: "Remote" });

      const linkedCandidates = (candidatesRes.data || []).filter((c) => {
        if (!currentJob) return false;
        const currentSelectedJobTitle = currentJob.title?.toLowerCase();
        const matchByIdString = c.jobId?.toString().toLowerCase() === currentSelectedJobTitle;
        const matchByTitleField = c.jobTitle?.toLowerCase() === currentSelectedJobTitle;
        const matchByDirectMongoId = c.jobId === jobId || c.jobId?._id === jobId;

        return matchByIdString || matchByTitleField || matchByDirectMongoId;
      });

      linkedCandidates.sort((a, b) => {
        const scoreA = a.score ?? a.aiScore ?? 0;
        const scoreB = b.score ?? b.aiScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.name.localeCompare(b.name);
      });

      setCandidates(linkedCandidates);
    } catch (err) {
      console.error("Failed to aggregate folder pipeline records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchPipelineData();
    }
  }, [jobId]);

  // 🟢 HANDLES SUBMITTING THE INLINED HUMAN INTERVIEW FORM
  const handleCreateInterviewSchedule = async (e) => {
    e.preventDefault();
    if (!interviewDate) {
      alert("Please designate a specific timeframe.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        candidateId: schedulingCandidate._id,
        name: schedulingCandidate.name,
        email: schedulingCandidate.email,
        jobId: jobId || null,
        type: "Human", 
        interviewDetails: {
          date: interviewDate,
          type: interviewType,
          link: meetingLink || "https://meet.google.com/mock-human-call"
        }
      };

      await axios.post("Frontend/HRMS/src/**/api/interviews/schedule", payload);
      alert("Standard human verification pipeline indexed successfully.");
      
      setSchedulingCandidate(null);
      setSchedulingType(null);
      setSchedulingMode("table"); 
      setInterviewDate("");
      setMeetingLink("");
      
      // 🟢 FIX: Re-fetch layout rows dynamically without relying on full page reloads!
      await fetchPipelineData();
    } catch (error) {
      console.error("Scheduler crash:", error);
      alert("Failed to bind scheduled meeting parameters.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto space-y-6">
        
        {/* Navigation bar controls */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/recruiter")} 
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl transition-colors text-slate-500 dark:text-slate-300"
          >
            &larr; Back to Core Dashboard
          </button>
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase">ISOLATED FOLDER VIEW</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400">Loading folder assets...</div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {job?.title} Application Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{job?.department} &bull; {job?.location}</p>
            
            {/* 🔄 THE CONDITIONAL SCREEN CONDENSER MAP VIEW */}
            {schedulingMode === "table" ? (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950">
                      <th className="py-3 px-4 w-16 text-center">S.No</th> 
                      <th className="py-3 px-4">Applicant Profile</th>
                      <th className="py-3 px-4">Email Frame</th>
                      <th className="py-3 px-4 text-center">Resume Asset</th>
                      <th className="py-3 px-4 text-center">Screening Status</th>
                      <th className="py-3 px-4 text-right">AI Match Score</th>
                      <th className="py-3 px-4 text-center">Action Parameters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs text-slate-600 dark:text-slate-300">
                    {candidates.map((c, index) => (
                      <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-400">{index + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{c.email}</td>
                        <td className="py-3.5 px-4 text-center">
                          {c.resumePdfRawUrl || c.resumeUrl ? (
                            <span className="text-indigo-500 font-bold">&#128196; Linked Asset Present</span>
                          ) : (
                            <span className="text-slate-400 italic">No File</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "Interview Completed" 
                              ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" 
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {c.status || "Applied"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-indigo-500">
                          {c.score || c.aiScore ? `${Number(c.score || c.aiScore).toFixed(2)} / 10` : "Not Evaluated"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {/* 🟢 DYNAMIC ROUTE REDIRECT: Add a report visualizer interceptor */}
                          {c.status === "Interview Completed" ? (
                            <button
                              onClick={() => setActiveFeedbackCandidate(c)}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                            >
                              📊 View AI Feedback
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setSchedulingCandidate(c);
                                setSchedulingType("choose");
                                setSchedulingMode("configure");
                                setInterviewType(c.interviewDetails?.type || "Technical Round");
                                setMeetingLink(c.interviewDetails?.link || "");
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                                c.status === "Interview Scheduled" 
                                  ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                              }`}
                            >
                              {c.status === "Interview Scheduled" ? "🔄 Update Schedule" : "📅 Schedule Interview"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {candidates.length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 italic">
                    No candidate records are currently loaded inside this pipeline track.
                  </p>
                )}
              </div>
            ) : (
              /* 🟢 INLINED INTERVIEW WIZARD CONTAINER VIEW */
              <div className="mt-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl mx-auto animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Initialize Screening Sequence</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Target Workspace: <span className="text-indigo-500 font-bold">{schedulingCandidate?.name}</span></p>
                  </div>
                  <button 
                    onClick={() => { setSchedulingMode("table"); setSchedulingType(null); setSchedulingCandidate(null); }} 
                    className="text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                  >
                    ✕ Cancel and Return
                  </button>
                </div>

                {/* MODE CHOOSE INTERCEPT BRANCH */}
                {schedulingType === "choose" && (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <button 
                      onClick={() => setSchedulingType("ai")}
                      className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/5 hover:bg-indigo-600/10 hover:border-indigo-500 transition-all text-left group"
                    >
                      <p className="font-bold text-xs text-indigo-500 uppercase tracking-widest flex items-center gap-1">🤖 Deploy Autonomous Assessment Node</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Launches Ava, your proctored synthetic interviewer. Collects raw speech telemetry and compiles a full 50-point report automatically.</p>
                    </button>
                    <button 
                      onClick={() => setSchedulingType("live")}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950 transition-all text-left"
                    >
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest">👥 Traditional Human Verification Link</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Generate a standard calendar meeting block to conduct a face-to-face evaluation panel with technical recruitment managers.</p>
                    </button>
                  </div>
                )}

                {/* HUMAN CALENDAR FORM FIELDS BRANCH */}
                {schedulingType === "live" && (
                  <form onSubmit={handleCreateInterviewSchedule} className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Interview Evaluation Category</label>
                      <select 
                        value={interviewType} 
                        onChange={(e) => setInterviewType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 outline-none font-medium text-slate-700 dark:text-slate-300"
                      >
                        <option value="Technical Round">Technical Core Evaluation</option>
                        <option value="System Design Architecture">System Design Architecture</option>
                        <option value="Culture & Behavioral Alignment">Culture & Behavioral Alignment</option>
                        <option value="Executive Assessment Screen">Executive Assessment Screen</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Target Calendar Timeframe Stamp</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 outline-none font-medium text-slate-700 dark:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Secure Meeting Dispatch URL</label>
                      <input 
                        type="url" 
                        placeholder={schedulingCandidate?.interviewDetails?.link ? `Leave blank to keep: ${schedulingCandidate.interviewDetails.link}` : "https://meet.google.com/abc-xyz-123"}
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 outline-none font-medium placeholder:text-slate-400 dark:text-slate-200"
                      />
                      {schedulingCandidate?.interviewDetails?.link && (
                        <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                          💡 Optional: Leave empty to keep the same link active.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setSchedulingType("choose")}
                        className="border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-950 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-sm"
                      >
                        {isSubmitting ? "Scheduling..." : "Confirm & Send"}
                      </button>
                    </div>
                  </form>
                )}

                {/* AI ROBOT SCHEDULER LAYOUT INJECTION */}
                {schedulingType === "ai" && (
                  <AIInterviewConfigModal
                    candidate={schedulingCandidate}
                    onClose={() => setSchedulingType("choose")}
                    onDeploymentSuccess={async () => {
                      setSchedulingCandidate(null);
                      setSchedulingType(null);
                      setSchedulingMode("table");
                      await fetchPipelineData(); // Refresh table status immediately!
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* 🟢 MODAL: INLINE COGNITIVE REPORT REVIEW HUD */}
        {activeFeedbackCandidate && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">AI Assessment Summary</h2>
                  <p className="text-xs text-slate-400">Candidate Profile: <span className="text-indigo-500 font-bold">{activeFeedbackCandidate.name}</span></p>
                </div>
                <button
                  onClick={() => setActiveFeedbackCandidate(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-thin">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-black tracking-wider text-indigo-500 block mb-1">Executive Summary</span>
                  <p className="font-medium italic">
                    "{activeFeedbackCandidate.interviewDetails?.aiFeedback?.summaryAssessment || 
                      "Comprehensive assessment log compiled successfully. Applicant shows solid competence with requested operational domain paradigms."}"
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">System Parameters Tracked</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                    <div>• Core Stack: MERN Stack</div>
                    <div>• Interview Track: Autonomous AI</div>
                    <div>• Status: Tx complete</div>
                    <div>• Verification: Synchronized</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveFeedbackCandidate(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Close Summary Window
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}