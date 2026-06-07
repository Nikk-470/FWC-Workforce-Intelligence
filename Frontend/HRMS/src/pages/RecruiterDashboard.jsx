import DashboardLayout from "@/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import FWCAIWidget from "@/components/ai/FWCAIWidget";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import AIInterviewConfigModal from "@/components/modals/AIInterviewConfigModal";

import { useLocation, useNavigate } from "react-router-dom"; // 🟢 Add useNavigate here

export default function RecruiterDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [schedulingCandidate, setSchedulingCandidate] = useState(null); 
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [manualMeetingLink, setManualMeetingLink] = useState("https://meet.google.com/mock-room-id");
  
  
  // 🏢 Job Drill-down Workflow View States
  const [viewMode, setViewMode] = useState("dashboard"); // Options: "dashboard", "jobsList", "jobPipeline"
  const [selectedJob, setSelectedJob] = useState(null); 
  const location = useLocation();
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

  useEffect(() => {
    fetchCandidates();
    fetchAnalytics();
    fetchJobsCatalog();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/candidates");
      setCandidates(res.data || []);
    } catch (error) {
      console.error("Error retrieving candidate tracking state:", error);
    }
  };

  const fetchJobsCatalog = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error("Error loading position data matrix:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/candidates/analytics");
      setAnalytics(res.data);
    } catch (error) {
      console.error("Error aggregating performance logs:", error);
    }
  };

  const handleUpdateStatus = async (candidateId, nextStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/candidates/${candidateId}/status`, { status: nextStatus });
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

      await axios.post("http://localhost:5000/api/interviews/schedule", payload);
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
        {viewMode === "dashboard" && (
          <>
            {/* ANALYTICS HUD SCOREBOARD TOP GRID CARD */}
{analytics && (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { title: "Total Talent Indexed", count: analytics.totalCandidates, sub: "Unique profiles in grid", action: null },
      // 🟢 ADDED: Tapping this specific card changes the layout state cleanly
      { title: "Active Applications", count: analytics.statusDistribution?.["Applied"] || 0, sub: "Awaiting triage (Click to View) ⚡", action: () => setViewMode("jobPipeline") },
      { title: "Vetted Screenings", count: analytics.statusDistribution?.["Screening"] || 0, sub: "Interactive loop running", action: null },
      { title: "Hired Conversion", count: analytics.statusDistribution?.["Hired"] || 0, sub: "Pipeline completion rate", action: null }
    ].map((metric, idx) => (
      <div 
        key={idx} 
        onClick={metric.action ? metric.action : undefined}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl relative shadow-sm overflow-hidden ${metric.action ? "cursor-pointer hover:border-indigo-500 transition-all" : ""}`}
      >
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{metric.title}</p>
        <p className="text-3xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">{metric.count}</p>
        <p className="text-[10px] text-slate-500 mt-1">{metric.sub}</p>
      </div>
    ))}
  </div>
)}

            {/* TWO-COLUMN PIPELINE DISCOVERY ENGINE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* CANDIDATE DATA GRID CONTROL */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Active Recruitment Streams</h2>
                    <p className="text-xs text-slate-500">Live monitoring of application progress logs.</p>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search candidate index..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-colors w-full sm:w-56"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950">
                        <th className="py-3 px-4">Profile</th>
                        <th className="py-3 px-4">Role Profile</th>
                        <th className="py-3 px-4">Current Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs text-slate-600 dark:text-slate-300">
                      {filteredCandidates.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <button onClick={() => setSelectedCandidate(c)} className="text-left group block">
                              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.email}</p>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-medium">{c.jobTitle || "Not Configured"}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === "Hired" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" :
                              c.status === "Interviewing" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400" :
                              c.status === "Screening" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400" :
                              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {c.status || "Applied"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={() => {
                                setSchedulingCandidate(c);
                                setSchedulingType("choose");
                              }} 
                              className="bg-slate-100 hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white transition-all text-[11px] font-bold px-3 py-1.5 rounded-xl"
                            >
                              📅 Dispatch Loop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCandidates.length === 0 && (
                    <p className="text-center py-8 text-xs text-slate-400 italic">No matching candidate footprints found.</p>
                  )}
                </div>
              </div>

              {/* LIVE RECHARTS PIE OVERVIEW REPORT */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Talent Matrix Breakdown</h3>
                  <p className="text-xs text-slate-500">Distribution of candidates across pipeline tiers.</p>
                </div>

                <div className="h-56 w-full flex items-center justify-center relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={buildStatusDistributionChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {buildStatusDistributionChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: "#0f172a", 
                          borderRadius: "12px", 
                          color: "#fff", 
                          fontSize: "11px",
                          border: "1px solid #334155" 
                        }} 
                      />
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
        window.location.href = "/recruiter/pipeline";
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
            <div className="flex items-center justify-between">
              <button 
                onClick={() => { setViewMode("dashboard"); setSelectedJob(null); }}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl transition-colors text-slate-500 dark:text-slate-300"
              >
                ← Back to Core Dashboard
              </button>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">DRILLDOWN MATRIX PIPELINE</span>
            </div>

            {/* INTERACTIVE OPEN JOB CARDS SELECTION WRAPPER */}
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

            {/* DETAILED APPLICANT MATRIX SHEET FOR SELECTED CARD */}
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
            href={c.resumePdfRawUrl || `http://localhost:5000/${c.resumeUrl}`}
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
      const res = await axios.post(`http://localhost:5000/api/candidates/${c._id}/evaluate-match`);
      
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
          onClick={() => { setSchedulingCandidate(c); if (typeof setSchedulingType === "function") setSchedulingType("choose"); }}
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