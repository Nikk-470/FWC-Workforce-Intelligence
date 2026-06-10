import DashboardLayout from "@/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import FWCAIWidget from "@/components/ai/FWCAIWidget";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import AIInterviewConfigModal from "@/components/modals/AIInterviewConfigModal";
import {  useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // 🟢 Add useNavigate here


export default function RecruiterDashboard() {


  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [schedulingCandidate, setSchedulingCandidate] = useState(null); 
  
const [schedulingMode, setSchedulingMode] = useState("table");

// 🟢 NEW: Reference pointer to activate hidden input array streams
const fileInputRef = useRef(null);

  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [manualMeetingLink, setManualMeetingLink] = useState("https://meet.google.com/mock-room-id");
  const navigate = useNavigate();

  // 🟢 NEW: Manual Internal Referral Ingestion Form States
  
  // 🏢 Job Drill-down Workflow View States
  const [viewMode, setViewMode] = useState("dashboard"); // Options: "dashboard", "jobsList", "jobPipeline"
  const [selectedJob, setSelectedJob] = useState(null); 
  const location = useLocation();

  
  const [manualJobId, setManualJobId] = useState("");
  const [manualResumeFiles, setManualResumeFiles] = useState([]);
  const [isUploadingManual, setIsUploadingManual] = useState(false);

  useEffect(() => {
    if (location.pathname === "/recruiter/pipeline") {
      setViewMode("jobPipeline");

      // 🟢 Automatically pick up the job details saved during the click!
      const savedJob = localStorage.getItem("selectedJob");
      const savedJobId = localStorage.getItem("selectedJobId");

      if (savedJob) {
        setSelectedJob(JSON.parse(savedJob));
      }
      if (savedJobId) {
        setSelectedJobId(savedJobId);
      }
    } else {
      setViewMode("dashboard");
    }
  }, [location.pathname]);

  const [isPdfExpanded, setIsPdfExpanded] = useState(false);

  // 💼 Job Vacancy Integration States
  const [jobs, setJobs] = useState([]);                   
  const [selectedJobId, setSelectedJobId] = useState(""); 

  // Form states for the interview scheduler
  const [schedulingType, setSchedulingType] = useState(null); // 'choose', 'live', or 'ai'
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewType, setInterviewType] = useState("Technical Round");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filter hooks
  const [searchQuery, setSearchQuery] = useState("");

  // 🟢 NEW: Appends newly chosen resumes to the existing selected files list instead of overwriting them
  const handleFileAppend = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setManualResumeFiles((prev) => [...(prev || []), ...newFiles]);
    }
  };

  // 🟢 NEW: Removes a specifically indexed resume from the selection track if clicked by mistake
  const handleRemoveFileItem = (indexToRemove) => {
    setManualResumeFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  useEffect(() => {
    fetchCandidates();
    fetchAnalytics();
    fetchJobsCatalog();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/candidates");
      setCandidates(res.data || []);
    } catch (error) {
      console.error("Error retrieving candidate tracking state:", error);
    }
  };

  const fetchJobsCatalog = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error("Error loading position data matrix:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/candidates/analytics");
      setAnalytics(res.data);
    } catch (error) {
      console.error("Error aggregating performance logs:", error);
    }
  };

  const handleUpdateStatus = async (candidateId, nextStatus) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/candidates/${candidateId}/status`, { status: nextStatus });
      if (res.data) {
        setSelectedCandidate(res.data.candidate);
        fetchCandidates();
        fetchAnalytics();
      }
    } catch (error) {
      alert("Status alteration sequence failed.");
    }
  };

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
        jobId: selectedJobId || schedulingCandidate.jobId || null,
        type: "Human", 
        interviewDetails: {
          date: interviewDate,
          type: interviewType,
          link: meetingLink || "https://meet.google.com/mock-human-call"
        }
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/interviews/schedule", payload);
      alert("Standard human verification pipeline indexed successfully.");
      
      // Clean states out
      setSchedulingCandidate(null);
      setSchedulingType(null);
      setInterviewDate("");
      setMeetingLink("");
      fetchCandidates();
    } catch (error) {
      console.error("Scheduler database commit crash:", error);
      alert("Failed to bind scheduled meeting parameters.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 NEW: Transmit manual file streams directly through your Groq AI backend parse loop
  // 🟢 NEW: Handles direct file processing through the AI pipeline
  const handleManualCandidateIngestion = async (e) => {
    e.preventDefault();
    if (!manualJobId) return alert("Please choose a targeted role opening profile.");
    if (!manualResumeFiles || manualResumeFiles.length === 0) return alert("Please select at least one valid resume PDF asset to parse.");

    setIsUploadingManual(true);
    
    const formDataPayload = new FormData();
    formDataPayload.append("jobId", manualJobId);
    
    // 🟢 FIXED: Append multiple files into your multipart/form-data storage buffer matching your routes rules array
    manualResumeFiles.forEach(file => {
      formDataPayload.append("resumes", file);
    });

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/candidates/upload-direct", formDataPayload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data.success) {
        alert(`Bulk Ingestion Complete! Successfully screened and injected ${res.data.count || res.data.candidates?.length || 1} candidate profiles into the pipeline target rows!`);
        
        // Reset form variables context
        setManualJobId("");
        setManualResumeFiles([]);
        e.target.reset();
        
        // Refresh grid metrics dashboard counters instantly
        fetchCandidates();
        fetchAnalytics();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error occurred while processing and extracting resume data structures.");
    } finally {
      setIsUploadingManual(false);
    }
  };
  // Recharts colors palette layout mapping
  const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"];

  const buildStatusDistributionChartData = () => {
    if (!analytics?.statusDistribution) return [];
    return Object.keys(analytics.statusDistribution).map(key => ({
      name: key,
      value: analytics.statusDistribution[key]
    }));
  };

  // Safe deep check to accurately filter list records cleanly
  const filteredCandidates = candidates.filter(item => {
    const term = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.jobTitle?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 text-slate-800 dark:text-slate-100 font-sans space-y-8 max-w-[1600px] mx-auto">
        
        {/* CORE HUD TAB CONTROL VIEWPORT SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setViewMode("dashboard"); setSelectedJob(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === "dashboard" ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              📊 Core Telemetry
            </button>
            <button 
              onClick={() => { setViewMode("jobsList"); setSelectedJob(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === "jobsList" ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-200 dark:hover:bg-slate-800"}`}
            >
              📁 Position Catalogs ({jobs.length})
            </button>
          </div>
          
          <div className="text-right text-[11px] font-mono opacity-60">
            SYSTEM HASH STATUS: ONLINE_SECURE_SYNC
          </div>
        </div>

        {/* -------------------------------------------------------------------------- */}
        {/* SUB-VIEW A: STANDARD METRICS DASHBOARD VIEWPORT                           */}
        {/* -------------------------------------------------------------------------- */}
      {/* -------------------------------------------------------------------------- */}
        {/* SUB-VIEW A: STANDARD METRICS DASHBOARD VIEWPORT                           */}
        {/* -------------------------------------------------------------------------- */}
        {viewMode === "dashboard" && (
          <>
            {/* ANALYTICS HUD SCOREBOARD TOP GRID CARD */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: "Total Talent Indexed", count: analytics.totalCandidates, sub: "Unique profiles in grid", color: "border-l-indigo-500", bg: "bg-indigo-500/5" },
                  { title: "Active Applications", count: analytics.statusDistribution?.["Applied"] || 0, sub: "Awaiting triage • View Pipeline ⚡", action: () => setViewMode("jobPipeline"), color: "border-l-emerald-500", bg: "bg-emerald-500/5" },
                  { title: "Vetted Screenings", count: analytics.statusDistribution?.["Screening"] || 0, sub: "Interactive loop running", color: "border-l-amber-500", bg: "bg-amber-500/5" },
                  { title: "Hired Conversion", count: analytics.statusDistribution?.["Hired"] || 0, sub: "Pipeline completion rate", color: "border-l-rose-500", bg: "bg-rose-500/5" }
                ].map((metric, idx) => (
                  <div 
                    key={idx} 
                    onClick={metric.action ? metric.action : undefined}
                    className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 border-l-4 ${metric.color} p-6 rounded-2xl relative shadow-xs overflow-hidden transition-all duration-200 ${metric.action ? "cursor-pointer hover:shadow-md hover:scale-[1.01]" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{metric.title}</p>
                        <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white tracking-tight font-sans">{metric.count}</p>
                      </div>
                      <div className={`p-2 rounded-xl text-xs font-mono font-bold ${metric.bg}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium flex items-center gap-1">{metric.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TWO-COLUMN PIPELINE DISCOVERY ENGINE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* LEFT DASHBOARD COLUMN CONTROLS: MICRO-WIDGETS + SCREEN LIST */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 🟢 NEW: TELEMETRY OPERATION MICRO-WIDGETS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">Active Open Roles</p>
                      <h4 className="text-xl font-black mt-1">{jobs.length} Positions</h4>
                    </div>
                    <span className="text-xl bg-white/10 p-2 rounded-xl">💼</span>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interviews Scheduled</p>
                      <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                        {candidates.filter(c => c.status === "Interviewing" || c.status === "Interview Scheduled").length} Pending
                      </h4>
                    </div>
                    <span className="text-xl bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">📅</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vetted Shortlists</p>
                      <h4 className="text-xl font-black text-emerald-500 mt-1">
                        {candidates.filter(c => c.status === "Shortlisted").length} Profiles
                      </h4>
                    </div>
                    <span className="text-xl bg-emerald-500/10 p-2 rounded-xl">⚡</span>
                  </div>
                </div>

                {/* CANDIDATE DATA GRID CONTROL */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity Log</h2>
                      <p className="text-xs font-medium text-slate-400">Real-time status modifications across candidate pipelines.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="text" 
                        placeholder="Search recent talent..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all w-full pl-8 text-slate-700 dark:text-slate-200"
                      />
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-slate-950">
                          <th className="py-3.5 px-5">Profile Name</th>
                          <th className="py-3.5 px-5">Target Role</th>
                          <th className="py-3.5 px-5">Pipeline State</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs text-slate-600 dark:text-slate-300">
                        {/* 🟢 DESIGN UPGRADE: Slit list down to top 5 items dynamically to reduce clutter */}
                        {filteredCandidates.slice(0, 5).map((c) => (
                          <tr key={c._id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-900/40 transition-colors group">
                            <td className="py-4 px-5">
                              <button onClick={() => setSelectedCandidate(c)} className="text-left block focus:outline-none">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.email}</p>
                              </button>
                            </td>
                            <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">{c.jobTitle || "Pooling"}</td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                                c.status === "Hired" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                c.status === "Interviewing" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400" :
                                c.status === "Screening" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400" :
                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                ● {c.status || "Applied"}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button 
                                onClick={() => {
                                  setSchedulingCandidate(c);
                                  setSchedulingType("choose");
                                }} 
                                className="bg-slate-50 border border-slate-200 dark:border-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white transition-all text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xs"
                              >
                                📅 Dispatch
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* 🟢 DESIGN UPGRADE: Persistent navigation anchor block to dive deep into explicit paths */}
                    {filteredCandidates.length > 5 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 text-center border-t border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => setViewMode("jobPipeline")}
                          className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                        >
                          View All {filteredCandidates.length} Active Candidates Inside Main Folders →
                        </button>
                      </div>
                    )}

                    {filteredCandidates.length === 0 && (
                      <div className="text-center py-12 text-xs text-slate-400 italic">No matching candidate records found.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN WRAPPER: EXPANDED AND UPGRADED CONTAINER SIZES */}
              <div className="space-y-6 min-w-0 lg:col-span-1">
                
                {/* UPGRADED: ENHANCED PROFILE INGESTION COMPONENT */}
                <form onSubmit={handleManualCandidateIngestion} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left space-y-5">
                  <div>
                    <h3 className="text-sm font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Internal Profile Ingestion</h3>
                    <p className="text-xs text-slate-400 mt-1">Bypass secondary candidate interfaces to directly sync resume batches using Groq AI.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Role Opening</label>
                    <select
                      value={manualJobId}
                      required
                      onChange={(e) => setManualJobId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-3 outline-none font-semibold text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="">-- Choose Targeted Vacancy Node --</option>
                      {jobs.map((job) => (
                        <option key={job._id} value={job._id}>{job.title} [{job.department || "General"}]</option>
                      ))}
                    </select>
                  </div>

                  {/* HIGH-STANDARD RESUME SELECTOR WORKSPACE GRID */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attach Resumes (PDF Format)</label>
                    
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileAppend}
                      className="hidden"
                    />

                    {(!manualResumeFiles || manualResumeFiles.length === 0) ? (
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950 text-center cursor-pointer transition-colors group"
                      >
                        <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">📄</span>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Click to Browse Resumes</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports multi-file selection batches</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-950/20 space-y-2">
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {manualResumeFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-xl text-xs shadow-3xs">
                              <div className="flex items-center gap-2 truncate max-w-[85%]">
                                <span className="text-slate-400">📎</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFileItem(idx)}
                                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-full text-[10px] font-bold transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="w-full py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-3xs"
                        >
                          <span>➕</span> Add More Resumes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ACTIVE AI PROCESSING STEP PROGRESS BAR SYSTEM */}
                  {isUploadingManual && (
                    <div className="space-y-1.5 animate-fadeIn bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 p-3 rounded-xl">
                      <div className="flex justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                          Groq AI Extracting Text Vector Layers...
                        </span>
                        <span>Active Tracking</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full w-full rounded-full animate-[shimmer_2s_infinite] bg-[length:200%_100%]" style={{ backgroundImage: "linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #6366f1 100%)" }} />
                      </div>
                      <p className="text-[10px] text-slate-400">Please maintain this dashboard window connection until transmission is confirmed.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploadingManual || !manualResumeFiles || manualResumeFiles.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    {isUploadingManual ? "🧬 Parsing Selection Pool..." : `Ingest ${manualResumeFiles?.length || 0} Candidate Profiles`}
                  </button>
                </form>

                {/* LIVE RECHARTS PIE OVERVIEW REPORT */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[420px] relative min-w-0 overflow-hidden">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Talent Matrix Breakdown</h3>
                    <p className="text-xs text-slate-500">Distribution of candidates across pipeline tiers.</p>
                  </div>

                  <div className="h-52 w-full relative my-2 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={buildStatusDistributionChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {buildStatusDistributionChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0f172a", borderRadius: "12px", color: "#fff", fontSize: "11px", border: "1px solid #334155" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-[11px]">
                    {buildStatusDistributionChartData().map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="truncate uppercase tracking-wider text-[10px]">{item.name}: <strong>{item.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

              </div> {/* END RIGHT COLUMN */}

            </div>
          </>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* SUB-VIEW B: JOBS LISTING CATALOGS                                          */}
        {/* -------------------------------------------------------------------------- */}
        {viewMode === "jobsList" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Corporate Vacancy Indexes</h2>
              <p className="text-xs text-slate-500">Select any posting module below to isolate active application files linked to it.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {jobs.map((job) => {
  // Fix the counter logic so it registers candidate text matches correctly
  const totalLinkedCandidates = candidates.filter(c => 
    c.jobId?.toString().toLowerCase() === job.title?.toLowerCase() || 
    c.jobTitle?.toLowerCase() === job.title?.toLowerCase()
  ).length;

  return (
      <div
      key={job._id}
      onClick={() => {
        // 1. Save the clicked job data so the next page can read it
        localStorage.setItem("selectedJob", JSON.stringify(job));
        localStorage.setItem("selectedJobId", job._id);
        
        // 2. Go to the separate pipeline page route
        window.location.href = "/recruiter/pipeline"
      }}
                    className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-2xl cursor-pointer hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all shadow-sm space-y-3 group"
                  >
                    <div>
                      <span className="text-[10px] font-mono tracking-wider bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase font-bold">
                        {job.department || "General"}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-400 mt-1.5 transition-colors">{job.title}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{job.location} • {job.type}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Linked Applications:</span>
                      <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-lg border border-indigo-500/20">{totalLinkedCandidates} active</span>
                    </div>
                  </div>
                );
              })}
              {jobs.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 col-span-full">No structured job postings found in backend files.</p>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* SUB-VIEW C: SPECIFIC JOB DRILLDOWN PIPELINE PORTAL                         */}
        {/* -------------------------------------------------------------------------- */}
        {/* -------------------------------------------------------------------------- */}
        {/* SUB-VIEW C: SPECIFIC JOB DRILLDOWN PIPELINE PORTAL WITH AI MARKINGS       */}
        {/* -------------------------------------------------------------------------- */}
        {viewMode === "jobPipeline" && (
          <div className="space-y-6 animate-fadeIn">
           

            INTERACTIVE OPEN JOB CARDS SELECTION WRAPPER
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => {
                const totalLinkedCandidates = candidates.filter(c => c.jobId === job._id || c.jobTitle?.toLowerCase() === job.title?.toLowerCase()).length;
                const isCurrentSelection = selectedJob?._id === job._id;
                return (
                  <div 
                    key={job._id}
                    onClick={() => {
                        setSelectedJob(job);
                        setSelectedJobId(job._id); // 🟢 Forces the backend filter ID to activate when tapped!
                        navigate(`/recruiter/pipeline/${job._id}`);
                      }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isCurrentSelection 
                        ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <span className="text-[10px] font-mono tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase font-bold">
                      {job.department || "General"}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{job.title}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{job.location} • <span className="text-indigo-500 font-bold">{job.type || "Full-time"}</span></p>
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Pipeline Total:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{totalLinkedCandidates} active</span>
                    </div>
                  </div>
                );
              })}
            </div>

            DETAILED APPLICANT MATRIX SHEET FOR SELECTED CARD
            {selectedJob && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-fadeIn">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{selectedJob.title} Application Ledger</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedJob.department} • {selectedJob.location}</p>
                
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950">
                        <th className="py-3 px-4">Applicant Profile</th>
                        <th className="py-3 px-4">Email Frame</th>
                        <th className="py-3 px-4 text-center">Resume Asset</th>
                        <th className="py-3 px-4 text-center">Screening Status</th>
                        <th className="py-3 px-4 text-right">AI Match Score</th>
                        <th className="py-3 px-4 text-center">Action Parameters</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs text-slate-600 dark:text-slate-300">
                    {candidates
  .filter((c) => {
    if (!selectedJob) return false;

    const currentSelectedJobTitle = selectedJob.title?.toLowerCase();
    
    // Check if any fields match the selected job's plain-text title
    const matchByIdString = c.jobId?.toString().toLowerCase() === currentSelectedJobTitle;
    const matchByTitleField = c.jobTitle?.toLowerCase() === currentSelectedJobTitle;
    const matchByDirectMongoId = c.jobId === selectedJob._id || c.jobId?._id === selectedJob._id;

    return matchByIdString || matchByTitleField || matchByDirectMongoId;
  })
  .map((c) => (
    <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
      <td className="py-3.5 px-4">
        <button onClick={() => setSelectedCandidate(c)} className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-500 transition-colors">
          {c.name}
        </button>
      </td>
      <td className="py-3.5 px-4 font-mono text-slate-400">{c.email}</td>
      <td className="py-3.5 px-4 text-center">
        {c.resumePdfRawUrl || c.resumeUrl ? (
          <a
            href={c.resumePdfRawUrl || `${import.meta.env.VITE_API_BASE_URL}/${c.resumeUrl}`}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-500 hover:text-indigo-600 font-bold underline"
          >
            📄 Open Resume
          </a>
        ) : (
          <span className="text-slate-400 italic">No File</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-center">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          c.status === "Shortlisted" ? "bg-emerald-500/10 text-emerald-500" :
          c.status === "Rejected" ? "bg-rose-500/10 text-rose-500" :
          c.status === "Interview Scheduled" || c.status === "Interviewing" ? "bg-indigo-500/10 text-indigo-500" :
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}>
          {c.status || "Applied"}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
        {/* 🟢 Fixes table data to safely look for both c.score and c.aiScore properties */}
        {(c.score !== undefined || c.aiScore !== undefined) ? (
          <span className={(c.score || c.aiScore) >= 7.0 ? "text-emerald-500" : (c.score || c.aiScore) >= 5.0 ? "text-amber-500" : "text-rose-500"}>
            {Number(c.score || c.aiScore).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
          </span>
        ) : (
          <span className="text-slate-400 italic font-normal text-xs font-sans">Not Evaluated</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-center space-x-2">
      <button 
  onClick={async (e) => {
    // 1. Prevent parent component click propagation anomalies
    e.stopPropagation();
    
    // 🟢 FIX: Save a solid, direct DOM reference immediately to bypass React re-render shifts
    const targetButton = e.currentTarget; 
    const originalText = targetButton.innerHTML;
    
    targetButton.innerHTML = "⏳ Analyzing...";
    targetButton.disabled = true;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/candidates/${c._id}/evaluate-match`);
      
      // Extract the score cleanly depending on your backend payload architecture structure
      const updatedScore = res.data?.score ?? res.data?.candidate?.score ?? res.data?.candidate?.aiScore ?? 0;
      
      alert(`AI Analysis Finalized! Assigned Matching Score: ${Number(updatedScore).toFixed(2)}/10`);
      
      // 3. Live Update State Array: This makes the UI switch from 0.00 to the fresh score instantly!
      setCandidates(prevCandidates => 
        prevCandidates.map(cand => 
          cand._id === c._id 
            ? { ...cand, score: updatedScore, aiScore: updatedScore } 
            : cand
        )
      );

      // Sync background state containers 
      fetchCandidates();
      fetchAnalytics();
    } catch (err) {
      console.error("AI Evaluation failed:", err);
      alert("AI evaluation service failure or unreadable PDF document structure.");
    } finally {
      // 🟢 FIX: Reset using our reliable stored reference variable instead of the mutable 'e' object
      if (targetButton) {
        targetButton.innerHTML = originalText;
        targetButton.disabled = false;
      } 
    }
  }}
  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm transition-all"
>
  ⚡ Grade Match
</button>
        <button 
  onClick={() => { 
    setSchedulingCandidate(c); 
    setSchedulingType("choose");
    setSchedulingMode("configure"); // 🟢 Switches view mode configuration on click
  }}
  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg"
>
  📅 Route Flow
</button>
      </td>
    </tr>
))}
                    </tbody>
                  </table>
                  {candidates.filter((c) => {
  if (!selectedJob) return false;
  const currentSelectedJobTitle = selectedJob.title?.toLowerCase();
  const candidateJobIdValue = c.jobId?.toString().toLowerCase();
  const candidateJobTitleValue = c.jobTitle?.toLowerCase();

  return (
    candidateJobIdValue === currentSelectedJobTitle ||
    candidateJobTitleValue === currentSelectedJobTitle
  );
}).length === 0 && (
  <p className="text-center py-8 text-xs text-slate-400 italic">
    No candidate records are currently loaded inside this pipeline track.
  </p>
)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* INTERACTIVE COMPONENT LAYER: CANDIDATE CONTEXT SIDE PANEL SLIDEOUT          */}
        {/* -------------------------------------------------------------------------- */}
        {selectedCandidate && (
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between animate-slideIn">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCandidate.email}</p>
                </div>
                <button 
                  onClick={() => { setSelectedCandidate(null); setIsPdfExpanded(false); }} 
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Status Update Matrix Dropdown Panel */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modify Pipeline State Target</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Applied", "Screening", "Interviewing", "Hired", "Rejected"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedCandidate._id, st)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all ${
                        selectedCandidate.status === st 
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-sm" 
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Resume Parser Meta Inspector */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Processed Index Profile Meta</span>
                  <button 
                    onClick={() => setIsPdfExpanded(!isPdfExpanded)} 
                    className="text-[10px] text-slate-400 hover:text-slate-200 font-bold underline"
                  >
                    {isPdfExpanded ? "Minimize Index" : "Inspect Raw Text"}
                  </button>
                </div>

                <div className="text-xs space-y-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <p>🎓 Education: <strong className="text-slate-800 dark:text-slate-100">{selectedCandidate.education || "Unspecified"}</strong></p>
                  <p>⏳ Tenure Parameter: <strong className="text-slate-800 dark:text-slate-100">{selectedCandidate.experience || "Unspecified"}</strong></p>
                  <p>🛠️ coreSkills: <span className="text-[11px] font-mono bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-indigo-500">{selectedCandidate.skills || "None parsed"}</span></p>
                </div>

                {isPdfExpanded && (
                  <div className="mt-3 border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
                    <label className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block mb-1">Raw Content Vector Extract</label>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl max-h-40 overflow-y-auto text-[11px] font-mono leading-relaxed text-slate-400 border border-slate-100 dark:border-slate-800 scrollbar-thin">
                      {selectedCandidate.rawResumeText || "No dynamic resume string payload committed on database record entry."}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                setSchedulingCandidate(selectedCandidate);
                setSelectedCandidate(null);
                setSchedulingType("choose");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-colors uppercase tracking-wider mt-4"
            >
              📅 Schedule Next Process Loop
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* INTERACTIVE COMPONENT LAYER: MULTI-TRACK INTERVIEW OVERLAY MODALS          */}
        {/* -------------------------------------------------------------------------- */}
        {schedulingCandidate && schedulingType && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Initialize Screening Sequence</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Target: {schedulingCandidate.name}</p>
                </div>
                <button 
                  onClick={() => { setSchedulingType(null); setSchedulingCandidate(null); }} 
                  className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* BRANCH A: SELECT SCREENING MODE */}
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

              {/* BRANCH B: TRADITIONAL HUMAN SCHEDULER FORM */}
              {schedulingType === "live" && (
                <form onSubmit={handleCreateInterviewSchedule} className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Interview Evaluation Category</label>
                    <select 
                      value={interviewType} 
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 outline-none font-medium text-slate-300"
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 outline-none font-medium text-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Secure Meeting Dispatch URL</label>
                    <input 
                      type="url" 
                      placeholder="https://meet.google.com/abc-xyz-123"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 outline-none font-medium placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setSchedulingType("choose")}
                      className="border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
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

              {/* BRANCH C: INTERCEPT AND INJECT OUR FULL-SCALE CONFIG MODAL ON "AI" STATE */}
              {schedulingType === "ai" && (
                <AIInterviewConfigModal
                  candidate={schedulingCandidate}
                  onClose={() => setSchedulingType("choose")} // Returns cleanly back to selection card overlay
                  onDeploymentSuccess={() => {
                    fetchCandidates();
                    fetchAnalytics();
                    setSchedulingCandidate(null);
                    setSchedulingType(null);
                  }}
                />
              )}

            </div>
          </div>
        )}

      </div>

      <FWCAIWidget />
    </DashboardLayout>
  );
}