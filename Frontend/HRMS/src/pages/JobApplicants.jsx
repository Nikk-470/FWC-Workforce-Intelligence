import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function JobApplicants() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [evaluatingId, setEvaluatingId] = useState(null);

  useEffect(() => {
    fetchDashboardTelemetry();
  }, []);

  const fetchDashboardTelemetry = async () => {
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/jobs`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/candidates`)
      ]);
      setJobs(jobsRes.data || []);
      setCandidates(candidatesRes.data || []);
      
      // Keep tracking references accurate on state refresh updates
      if (selectedJob) {
        const refreshedJob = (jobsRes.data || []).find(j => j._id === selectedJob._id);
        if (refreshedJob) setSelectedJob(refreshedJob);
      }
    } catch (error) {
      console.error("Error pooling track structures:", error);
    }
  };

  const handleAiProfilingMatch = async (candidateId) => {
    setEvaluatingId(candidateId);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/candidates/${candidateId}/evaluate-match`);
      const { score, status } = response.data;
      alert(`Evaluation complete! Grade: ${Number(score).toFixed(2)}/10. Status updated to: ${status}`);
      fetchDashboardTelemetry();
    } catch (err) {
      console.error(err);
      alert("AI matching matrix process aborted due to internal parser network failure.");
    } finally {
      setEvaluatingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Active Applicant Pipelines</h1>
          <p className="text-xs text-slate-400">Click on an active position card below to parse candidate metrics and execute AI alignment processing.</p>
        </div>

        {/* INTERACTIVE CARDS CONTAINER GRIDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const currentTrackCandidates = candidates.filter(c => c.jobId === job._id);
            const activeSelectionIndex = selectedJob?._id === job._id;

            return (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer duration-200 relative overflow-hidden ${
                  activeSelectionIndex 
                    ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20" 
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase">
                    {job.department || "General"}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-500 font-mono">
                    {job.type || "Full-time"}
                  </span>
                </div>
                
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-3">{job.title}</h3>
                <p className="text-xs text-slate-400 font-medium">{job.location}</p>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Total Pipeline Records:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-sm">{currentTrackCandidates.length}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* APPLICANT TRACK EXPANSION DRAWER VIEW */}
        {selectedJob && (
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-sm animate-fadeIn">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Review Matrix Stream</span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedJob.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-xs text-slate-400 hover:text-rose-500 font-bold font-mono"
              >
                ✕ Clear View
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Candidate Info</th>
                    <th className="py-3 px-3">Email Frame</th>
                    <th className="py-3 px-3 text-center">Resume Asset</th>
                    <th className="py-3 px-3 text-center">Screening Status</th>
                    <th className="py-3 px-3 text-right">AI Match Score</th>
                    <th className="py-3 px-3 text-center">Action Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {candidates.filter(c => c.jobId === selectedJob._id).map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all">
                      <td className="py-4 px-3 font-bold text-slate-900 dark:text-white">{candidate.name}</td>
                      <td className="py-4 px-3 font-mono font-medium text-slate-500">{candidate.email}</td>
                      <td className="py-4 px-3 text-center">
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL}/${candidate.resumeUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-500 hover:text-indigo-600 font-black tracking-tight underline inline-flex items-center gap-1"
                        >
                          📄 View Resume
                        </a>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          candidate.status === 'Shortlisted' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : candidate.status === 'Rejected' 
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {candidate.status || 'Applied'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right font-mono font-black text-sm">
                        {candidate.aiScore ? (
                          <span className={candidate.aiScore >= 7.0 ? "text-emerald-500" : candidate.aiScore >= 5.0 ? "text-amber-500" : "text-rose-500"}>
                            {Number(candidate.aiScore).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal text-xs font-sans">Not Evaluated</span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          disabled={evaluatingId === candidate._id}
                          onClick={() => handleAiProfilingMatch(candidate._id)}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all"
                        >
                          {evaluatingId === candidate._id ? "Scrutinizing..." : "⚡ Grade Match"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {candidates.filter(c => c.jobId === selectedJob._id).length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 italic text-xs">
                        No active applicant data profiles have registered for this selection index track.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}