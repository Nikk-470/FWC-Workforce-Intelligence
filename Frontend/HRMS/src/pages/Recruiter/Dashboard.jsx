import DashboardLayout from "@/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRef } from "react";
import FWCAIWidget from "@/components/ai/FWCAIWidget";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function RecruiterDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [schedulingCandidate, setSchedulingCandidate] = useState(null); // 📅 State for the scheduling form
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // 💼 Job Vacancy Integration States
  const [jobs, setJobs] = useState([]);                   // Holds jobs fetched from MongoDB
  const [selectedJobId, setSelectedJobId] = useState(""); // Holds the dropdown value chosen by user

  // Form states for the new interview scheduler
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewType, setInterviewType] = useState("Technical");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchCandidates();
    fetchAnalytics();
    fetchJobs(); // ➕ Fetch jobs alongside your core analytics
  }, []);

  // ➕ Fetch jobs from your vacancy router endpoint
  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs");
      // Fallback check based on how your backend drops responses: res.data or res.data.jobs
      const availableJobs = res.data.jobs || res.data || [];
      setJobs(availableJobs);
      
      // Auto-select the first job in the dropdown sequence if it exists
      if (availableJobs.length > 0) {
        setSelectedJobId(availableJobs[0]._id);
      }
    } catch (error) {
      console.log("Error fetching jobs listing for dropdown selection:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/analytics/recruiter"
      );
      setAnalytics(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/candidates");
      const rawCandidates = res.data.candidates || [];
      
      const sortedCandidates = [...rawCandidates].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0; 
      });

      if (!rawCandidates[0]?.createdAt) {
        sortedCandidates.reverse();
      }

      setCandidates(sortedCandidates);
    } catch (error) {
      console.log(error);
    }
  };

  // 🔄 MODIFIED: Sends selectedJobId alongside your multi-file upload payload
  const uploadResume = async () => {
    if (files.length === 0) {
      alert("Please select a resume first");
      return;
    }

    if (!selectedJobId) {
      alert("Please select a target job opening vacancy first before submitting!");
      return;
    }

    try {
      const formData = new FormData();
      
      // 💼 Append the Selected vacancy job identifier 
      formData.append("jobId", selectedJobId);

      // 📄 Append the array files
      files.forEach((file) => {
        formData.append("resume", file);
      });

      // Updated path to reflect standard /api/resumes/upload or /api/resume/upload
      await axios.post(
        "http://localhost:5000/api/resume/upload", 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Resumes processed and successfully linked to the selected job vacancy!");
      setFiles([]); 
      await fetchCandidates(); 
      await fetchAnalytics(); 

    } catch (error) {
      console.log("Upload process error encountered:", error);
      alert("Error occurred while processing resumes. See browser console.");
    }
  };

  // Function to submit interview parameters to backend
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewDate || !meetingLink) {
      alert("Please fill in all scheduling fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/interviews", {
        candidateId: schedulingCandidate._id,
        candidateName: schedulingCandidate.name,
        candidateEmail: schedulingCandidate.email,
        date: interviewDate,
        type: interviewType,
        link: meetingLink,
      });

      alert(`Successfully scheduled an interview with ${schedulingCandidate.name}!`);
      
      // Reset state form elements and close modal
      setInterviewDate("");
      setMeetingLink("");
      setSchedulingCandidate(null);
    } catch (error) {
      console.error(error);
      alert("Failed to schedule interview. Please check your backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All"
        ? true
        : candidate.recommendation === filter;

    return matchesSearch && matchesFilter;
  });

  const chartData = [
    { name: "Shortlisted", value: analytics?.shortlisted || 0, color: "#10b981" }, 
    { name: "Consider", value: analytics?.considered || 0, color: "#f59e0b" },    
    { name: "Rejected", value: analytics?.rejected || 0, color: "#ef4444" },     
  ];

  return (
    <DashboardLayout>
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recruiter Dashboard</h1>
        <p className="text-slate-500 mt-1">
          AI-Powered Recruitment & Candidate Screening
        </p>
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-sm font-medium text-slate-500">Total Pool</p>
            <h2 className="text-3xl font-bold text-slate-800 mt-2">{candidates.length}</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-sm font-medium text-green-600">AI Shortlisted</p>
            <h2 className="text-3xl font-bold text-green-600 mt-2">{analytics?.shortlisted || 0}</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-sm font-medium text-amber-600">To Consider</p>
            <h2 className="text-3xl font-bold text-amber-600 mt-2">{analytics?.considered || 0}</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-sm font-medium text-red-600">Rejected Pool</p>
            <h2 className="text-3xl font-bold text-red-600 mt-2">{analytics?.rejected || 0}</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-sm font-medium text-indigo-600">Avg Candidate Score</p>
            <h2 className="text-3xl font-bold text-indigo-600 mt-2">{analytics?.averageScore || 0}<span className="text-lg font-normal text-slate-400">/10</span></h2>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-5 border border-indigo-100/50 flex flex-col justify-center">
            <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Processing Engine</p>
            <p className="text-xs text-slate-500 mt-1">Groq LPU integration active for bulk resume uploads.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-2 h-full min-h-[180px]">
          <div className="flex-1 h-32 max-w-[150px]">
            {candidates.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No Data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={45}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 flex-1 pr-2">
            <h3 className="text-xs font-bold text-slate-700 mb-1">AI Classification</h3>
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Resume Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
        <h2 className="text-xl font-bold mb-4">AI Resume Screening</h2>

        {/* ➕ UI UPDATE: Target Vacancy Dropdown Menu added right here */}
        <div className="mb-4 max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Target Job Opening Position
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full border border-slate-200 focus:border-indigo-500 outline-none rounded-xl px-3 py-2 bg-white text-sm text-slate-700 cursor-pointer transition-all shadow-sm"
          >
            {jobs.length === 0 ? (
              <option value="" disabled>No active jobs found. Create one first!</option>
            ) : (
              jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} — {job.department || "General"}
                </option>
              ))
            )}
          </select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const chosenFiles = Array.from(e.target.files);
            const pdfFiles = chosenFiles.filter(file => file.type === "application/pdf");
            
            if (pdfFiles.length !== chosenFiles.length) {
              alert("Only PDF files are allowed!");
            }
            setFiles((prev) => [...prev, ...pdfFiles]);
          }}
        />

        <div className="border border-slate-200 rounded-xl p-3 min-h-[60px]">
          {files.length === 0 ? (
            <p className="text-slate-400 text-sm">No resumes selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                  <span>{file.name}</span>
                  <button onClick={() => setFiles(files.filter((_, i) => i !== index))} className="font-bold hover:text-indigo-900">×</button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current.click()} className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">+</button>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex justify-end mt-2">
            <button onClick={() => setFiles([])} className="text-red-500 text-sm font-medium">Clear All</button>
          </div>
        )}

        <button
          onClick={() => { files.length === 0 ? fileInputRef.current.click() : uploadResume(); }}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all"
        >
          {files.length === 0 ? "Upload Resume" : "Submit"}
        </button>
      </div>

      {/* Full Width Candidate Pipeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Candidate Pipeline</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="🔍 Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-2 w-full sm:w-64 transition-all text-sm"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-slate-200 focus:border-indigo-500 outline-none rounded-xl px-4 py-2 bg-white text-sm font-medium text-slate-700 cursor-pointer transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Shortlist">Shortlisted</option>
              <option value="Consider">Consider</option>
              <option value="Reject">Rejected</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredCandidates.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No matching candidates found inside your database.</p>
          ) : (
            filteredCandidates.map((candidate) => (
              <div
                key={candidate._id}
                onClick={() => setSelectedCandidate(candidate)}
                className="p-5 bg-slate-50/60 hover:bg-slate-50 rounded-xl flex justify-between items-center cursor-pointer transition-all border border-slate-100 hover:border-slate-300 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-base">{candidate.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{candidate.email} • {candidate.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {candidate.skills?.slice(0, 4).map((skill, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-4">
                  <p className="font-bold text-lg text-indigo-600">Score: {candidate.score}<span className="text-xs font-normal text-slate-400">/10</span></p>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-2 tracking-wide ${
                    candidate.recommendation === "Shortlist" ? "bg-green-100 text-green-700" :
                    candidate.recommendation === "Consider" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {candidate.recommendation === "Shortlist" ? "Shortlisted" : candidate.recommendation}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white w-[700px] max-w-[90%] rounded-3xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Candidate Evaluation Profile</h2>
                <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>
              <div className="mt-6 space-y-4 text-slate-700">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p><strong>Name:</strong> {selectedCandidate.name}</p>
                  <p><strong>Email:</strong> {selectedCandidate.email}</p>
                  <p><strong>Phone:</strong> {selectedCandidate.phone}</p>
                  <p><strong>AI Evaluation Score:</strong> <span className={selectedCandidate.score >= 8 ? "text-green-600 font-bold" : selectedCandidate.score >= 6 ? "text-amber-600 font-bold" : "text-red-600 font-bold"}>{selectedCandidate.score}/10</span></p>
                </div>
                <div>
                  <strong>Recommendation Status:</strong>{" "}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ml-2 ${
                    selectedCandidate.recommendation === "Shortlist" ? "bg-green-600" : selectedCandidate.recommendation === "Consider" ? "bg-amber-500" : "bg-red-600"
                  }`}>{selectedCandidate.recommendation}</span>
                </div>
                <p><strong>Education Summary:</strong> {selectedCandidate.education}</p>
                <p><strong>Work Experience:</strong> {selectedCandidate.experience}</p>
                <div>
                  <strong>Original Core Competencies:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedCandidate.skills?.map((skill, i) => (
                      <span key={i} className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <strong className="text-green-800">Identified Strengths:</strong>
                    <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-green-900">
                      {selectedCandidate.strengths?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <strong className="text-red-800">Constructive Weaknesses:</strong>
                    <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-red-900">
                      {selectedCandidate.weaknesses?.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar at the Bottom of Profile Modal */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
              <button 
                onClick={() => setSelectedCandidate(null)} 
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setSchedulingCandidate(selectedCandidate); // Sets target candidate
                  setSelectedCandidate(null); // Smoothly shuts profile overlay
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📅 NEW Separate Interview Scheduling Modal */}
      {schedulingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white w-[500px] max-w-[90%] rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Schedule Interview</h2>
                <p className="text-xs text-slate-500 mt-0.5">Setting up meeting details for <strong>{schedulingCandidate.name}</strong></p>
              </div>
              <button 
                onClick={() => setSchedulingCandidate(null)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Interview Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interview Round</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full border border-slate-200 outline-none focus:border-indigo-500 rounded-xl px-3 py-2 bg-white text-sm"
                >
                  <option value="Technical Round">Technical Round</option>
                  <option value="HR Screening">HR Screening</option>
                  <option value="System Design">System Design</option>
                  <option value="Managerial Round">Managerial Round</option>
                </select>
              </div>

              {/* Date/Time Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full border border-slate-200 outline-none focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-700"
                />
              </div>

              {/* Meeting Link Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Meeting URL (Zoom / Google Meet)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full border border-slate-200 outline-none focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-700"
                />
              </div>

              {/* Action Buttons inside Form */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingCandidate(null)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? "Scheduling..." : "Confirm & Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FWCAIWidget />
    </DashboardLayout>
  );
}