import DashboardLayout from "@/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import { Briefcase, MapPin, Users, Plus, Layers, DollarSign, X } from "lucide-react";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal toggle state and form capture state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    experienceLevel: "Junior",
    description: "",
    requirements: "",
    minSalary: 0,
    maxSalary: 0,
    currency: "USD"
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error("Error loading job board postings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Submit new job to Express & MongoDB
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        experienceLevel: formData.experienceLevel,
        description: formData.description,
        requirements: formData.requirements, // Handles string tracking (split handled by backend)
        salaryRange: {
          min: Number(formData.minSalary),
          max: Number(formData.maxSalary),
          currency: formData.currency
        }
      };

      await axios.post("http://localhost:5000/api/jobs", payload);
      
      // Reset form states and refresh view
      setIsModalOpen(false);
      setFormData({
        title: "", department: "", location: "", type: "Full-time",
        experienceLevel: "Junior", description: "", requirements: "",
        minSalary: 0, maxSalary: 0, currency: "USD"
      });
      fetchJobs();
    } catch (error) {
      console.error("Error saving job configuration entry:", error);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Top Action Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job Management</h1>
          <p className="text-slate-500 mt-1">Create, monitor, and configure corporate job openings and parameters.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="🔍 Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-2.5 w-full sm:w-64 transition-all text-sm bg-white shadow-sm"
          />
          <button 
            onClick={() => setIsModalOpen(true)} // Open interactive modal configuration form
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Plus size={16} />
            Post a Job
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading active organizational postings...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto mt-8">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No jobs posted yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Get started by posting your first job opening to start accepting and screening applications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats Summary Row */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={20} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Postings</p>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5">{jobs.length} Active Positions</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Users size={20} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pipeline Applications</p>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5">{jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0)} Candidates</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Layers size={20} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</p>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5">{new Set(jobs.map(j => j.department)).size} Distinct Teams</h3>
              </div>
            </div>
          </div>

          {/* Job Postings Cards Grid Layout */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div key={job._id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="inline-block bg-slate-50 text-slate-600 font-medium text-xs px-2.5 py-1 rounded-md border border-slate-100 mb-2">{job.department}</span>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{job.status}</span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500 font-medium mb-6">
                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" />{job.location} ({job.type})</div>
                    <div className="flex items-center gap-1.5"><DollarSign size={14} className="text-slate-400" />{job.salaryRange?.min?.toLocaleString()} - {job.salaryRange?.max?.toLocaleString()} {job.salaryRange?.currency}</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 font-semibold">
                    <Users size={16} className="text-indigo-500" />
                    <span>{job.applicationsCount || 0} Applied</span>
                  </div>
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">Manage Pipeline &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🛠️ POST A JOB DIALOG MODAL VIEW LAYER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Post New Job Opening</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Job Title</label>
                <input required type="text" placeholder="e.g. Senior Frontend Engineer" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                  <input required type="text" placeholder="e.g. Engineering" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Location</label>
                  <input required type="text" placeholder="e.g. Remote / NYC" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Job Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none bg-white">
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Experience Level</label>
                  <select value={formData.experienceLevel} onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none bg-white">
                    <option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead/Executive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Min Salary</label>
                  <input type="number" value={formData.minSalary} onChange={(e) => setFormData({...formData, minSalary: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Max Salary</label>
                  <input type="number" value={formData.maxSalary} onChange={(e) => setFormData({...formData, maxSalary: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Key Requirements (Comma-separated for AI Matching)</label>
                <input type="text" placeholder="React, Node.js, TypeScript, AWS" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Job Description</label>
                <textarea required rows={3} placeholder="Provide details regarding day-to-day core activities..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none resize-none" />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all">Publish Posting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}