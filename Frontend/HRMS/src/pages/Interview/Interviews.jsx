import DashboardLayout from "@/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import AIInterviewFeedbackView from "./AIInterviewFeedbackView"; // Import the feedback view here

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track state for viewing a specific candidate's AI Evaluation report
  const [selectedAiReport, setSelectedAiReport] = useState(null);

  useEffect(() => {
    fetchScheduledInterviews();
  }, []);

  const fetchScheduledInterviews = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/interviews/scheduled");
      setInterviews(res.data || []);
    } catch (error) {
      console.error("Error loading interview calendar panel:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter list based on search bar parameters
  const filteredInterviews = interviews.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.interviewDetails?.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyAiInviteLink = (candidateId) => {
    const generatedLink = `${window.location.origin}/interview/session/${candidateId}`;
    navigator.clipboard.writeText(generatedLink);
    alert("Candidate AI Assessment link copied to clipboard!");
  };

  // If a recruiter clicks "View AI Report", shift view from list to the explicit evaluation deck
  if (selectedAiReport) {
    return (
      <AIInterviewFeedbackView 
        interviewData={selectedAiReport} 
        onBack={() => {
          setSelectedAiReport(null);
          fetchScheduledInterviews(); // Refresh structural listings
        }} 
      />
    );
  }

  return (
    <DashboardLayout>
      {/* Top Header Row */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Interview Central</h1>
          <p className="text-slate-500 mt-1">Track, monitor, and audit both human syncs and deployed AI bots.</p>
        </div>
        
        <input
          type="text"
          placeholder="🔍 Search by candidate or round..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-2.5 w-full sm:w-72 transition-all text-sm bg-white shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading master agenda sync records...</div>
      ) : interviews.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No interviews are currently scheduled in the pipeline.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Quick Metrics Cards */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Booked</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{interviews.length} Sessions</h3>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Technical Rounds</p>
              <h3 className="text-xl font-bold text-indigo-600 mt-1">
                {interviews.filter(i => i.interviewDetails?.type === "Technical Round").length} Active
              </h3>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">AI Voice Screeners</p>
              <h3 className="text-xl font-bold text-violet-600 mt-1">
                {interviews.filter(i => i.interviewDetails?.type?.includes("AI")).length} Deployed
              </h3>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Shortlisted</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">
                {interviews.filter(i => i.recommendation === "Shortlist").length} Profiles
              </h3>
            </div>
          </div>

          {/* Master Schedule List Grid Layout */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 text-base">All Sessions Directory</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3.5 px-6">Candidate</th>
                    <th className="py-3.5 px-6">Interview Round</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6 text-right">Actions / Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredInterviews.map((item) => {
                    const sessionDate = new Date(item.interviewDetails?.date || item.scheduledAt);
                    const isAiRound = item.interviewDetails?.type?.includes("AI") || item.mode?.includes("AI");

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-all">
                        {/* Name & Contact */}
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.email}</p>
                          </div>
                        </td>

                        {/* Round badge */}
                        <td className="py-4 px-6">
                          <span className={`inline-block font-semibold text-xs px-2.5 py-1 rounded-md border ${
                            isAiRound 
                              ? "bg-violet-50 text-violet-700 border-violet-100" 
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}>
                            {isAiRound ? "🤖 AI Voice Assessment" : (item.interviewDetails?.type || "General Round")}
                          </span>
                        </td>

                        {/* Structured Date & Time */}
                        <td className="py-4 px-6 font-medium text-slate-600">
                          {sessionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          <span className="text-slate-400 mx-1.5">•</span>
                          {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Action buttons mapping conditional streams */}
                        <td className="py-4 px-6 text-right">
                          {isAiRound ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => copyAiInviteLink(item._id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                              >
                                🔗 Copy Invite Link
                              </button>
                              <button
                                onClick={() => setSelectedAiReport({
                                  candidateName: item.name,
                                  targetRole: item.targetRole || "Software Engineer",
                                  matchDate: sessionDate.toLocaleDateString(),
                                  callDuration: "14 Mins 22 Secs",
                                  voiceToneUsed: item.config?.voiceTone || "Professional Male",
                                  overallScore: 42, // Mock rating data container
                                  feedbackMatrix: {
                                    positives: ["Clear articulation of tech structures.", "Highly proactive optimizations."],
                                    negatives: ["Minor hesitation on advanced fallbacks."]
                                  },
                                  extractedContext: {
                                    skillsVerified: item.skillsMatrix || ["React", "Node.js"],
                                    projectsDiscussed: ["Production Sandbox Suite"]
                                  }
                                })}
                                className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all"
                              >
                                View AI Report
                              </button>
                            </div>
                          ) : (
                            <a
                              href={item.interviewDetails?.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all"
                            >
                              Join Human Call
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Fallback search alert element */}
              {filteredInterviews.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">No matching records fit your search criteria.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}