import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, MapPin, Building, Upload, X, CheckCircle, Loader2, 
  DollarSign, FileText, ArrowRight, Search, Calendar, Sun, Moon, Info, Sparkles, Filter
} from 'lucide-react';

const CareersPage = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Defaulting strictly to premium dark mode
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for the actionable inline filter dropdown
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const fetchOpenJobs = async () => {
      try {
        // 🟢 Hits Endpoint 1 inside recruitmentRoutes mounted at /api base path
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/jobs`
        );
        setJobs(response.data || []);
      } catch (err) {
        console.error('Error loading job postings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOpenJobs();
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert("Please upload your resume before submitting.");
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('jobId', selectedJob._id);
      payload.append('jobTitle', selectedJob.title); // Pass job details along
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('phone', formData.phone);
      payload.append('resume', resumeFile);

      // 🟢 REDIRECTED PATH: Sends data to your updated recruitmentRoutes validation schema entry
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/candidates/apply-public`,
        payload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setIsSuccess(true);
      setFormData({ name: '', email: '', phone: '' });
      setResumeFile(null);
    } catch (err) {
      console.error('Submission Error:', err);
      alert(err.response?.data?.message || 'Could not process application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setIsSuccess(false);
    setResumeFile(null);
  };

  const isJobExpired = (job) => {
    const targetDate = job.openingTo || job.openingToDate || job.closingDate || job.endDate || job.deadline;
    if (targetDate) {
      const expiry = new Date(targetDate);
      const now = new Date();
      return now > expiry;
    }
    return job.status === "Expired";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not Specified";
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return "Not Specified";
    
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return parsedDate.toLocaleDateString('en-US', options);
  };

  // Extract unique filtering items dynamically
  const departments = ['All', ...new Set(jobs.map(j => j.department).filter(Boolean))];
  const locations = ['All', ...new Set(jobs.map(j => j.location).filter(Boolean))];

  // Combined Filtering Logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === 'All' || job.department === selectedDepartment;
    const matchesLoc = selectedLocation === 'All' || job.location === selectedLocation;
    
    return matchesSearch && matchesDept && matchesLoc;
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 antialiased pb-24 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 🧭 NAVIGATION BAR */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-md px-8 py-5 flex items-center justify-between transition-colors ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'}`}>
        <div className="flex items-center gap-10 w-full max-w-none">
          <div className="flex items-center gap-3 cursor-pointer group shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-lg tracking-wider shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              FWC
            </div>
            <span className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              FWC<span className="text-violet-600 font-medium">Careers</span>
            </span>
          </div>

          <div className="flex items-center relative w-full max-w-xl">
            <Search className="absolute left-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search active roles, frameworks, or departments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-sm rounded-xl pl-11 pr-4 py-3 border outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-violet-500' : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-violet-600 focus:bg-white'}`}
            />
          </div>
        </div>

        <div className="flex items-center ml-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* 📐 MAIN CONTAINER */}
      <div className="w-full px-8 pt-10">
        
        {/* 🏢 HERO BANNER */}
        <div className={`w-full rounded-3xl p-8 sm:p-12 mb-10 border relative overflow-hidden transition-all text-left ${darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-950/10 to-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="absolute right-0 top-0 w-[32rem] h-[32rem] bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-full space-y-5 relative z-10">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
              <Sparkles size={14} /> Innovation Hub
            </div>
            
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Get Hired by <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">FWC Teams</span>
            </h1>
            
            <p className={`text-base sm:text-lg leading-relaxed max-w-5xl ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Join an elite collective building scalable architectures, intuitive product ecosystems, and next-generation systems. Discover your path, access technical blueprints, and secure your place in a performance-driven engineering workforce.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 w-full">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-violet-600 mb-2">Ownership First</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Autonomous development environments with zero micromanagement frameworks.</p>
              </div>
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-500 mb-2">Global Scale</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Ship cloud systems accommodating real-time production pipelines worldwide.</p>
              </div>
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-fuchsia-500 mb-2">Hybrid Merit</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Competitive, market-leading remuneration tied directly to system impacts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🛠️ CONTROLS SECTION */}
        <div className="w-full relative mb-6">
          <div className="flex items-end justify-between px-2">
            <div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Job Openings
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Found {filteredJobs.length} employment profiles
              </p>
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                showFilters 
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md' 
                  : darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className={`w-full mt-4 p-5 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-200 grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-20 ${
              darkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                <select 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none bg-transparent ${darkMode ? 'border-slate-700 text-white bg-slate-900' : 'border-slate-200 text-slate-700 bg-white'}`}
                >
                  {departments.map(dept => <option key={dept} value={dept} className={darkMode ? 'bg-slate-950' : 'bg-white'}>{dept}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Location Strategy</label>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none bg-transparent ${darkMode ? 'border-slate-700 text-white bg-slate-900' : 'border-slate-200 text-slate-700 bg-white'}`}
                >
                  {locations.map(loc => <option key={loc} value={loc} className={darkMode ? 'bg-slate-950' : 'bg-white'}>{loc}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 🛠️ CARDS FEED STREAM */}
        <div className="w-full space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 text-sm">
              <Loader2 className="animate-spin text-violet-600" size={32} /> 
              <span>Syncing core vacancy directories...</span>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-5 w-full">
              {filteredJobs.map((job) => {
                const expired = isJobExpired(job);
                const currencySymbol = job.currency || "INR";
                const minSalaryVal = job.minSalary;
                const maxSalaryVal = job.maxSalary;
                const deadlineDate = job.openingTo;

                // 🟢 Dynamically appends host tracking to local disk document strings
                const pdfAssetUrl = job.jdPdfUrl ? `${import.meta.env.VITE_API_BASE_URL}${job.jdPdfUrl}` : null;

                return (
                  <div 
                    key={job._id} 
                    className={`w-full rounded-2xl border p-6 sm:p-8 transition-all duration-300 relative flex flex-col justify-between ${
                      darkMode ? 'bg-slate-900 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-3 w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-9 h-9 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl flex items-center justify-center text-xs font-black tracking-wider">
                            FWC
                          </div>
                          <span className={`text-base font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {job.department} <span className="text-slate-400 mx-1">•</span> 
                          </span>
                          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight inline ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {job.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {job.requirements && (Array.isArray(job.requirements) ? job.requirements : String(job.requirements).split(',')).map((req, i) => (
                            <span key={i} className={`text-xs font-semibold px-3 py-1 rounded-md border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                              {req.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-xs sm:text-sm font-bold text-slate-400 whitespace-nowrap self-start lg:self-auto bg-slate-500/5 p-3 rounded-xl border border-slate-500/10">
                        <div className="flex items-center gap-2 px-2"><Calendar size={16} className="text-slate-400" /> <span>{job.experienceLevel || "Mid-Senior"}</span></div>
                        <div className="flex items-center gap-2 px-2 border-l border-slate-200/20"><MapPin size={16} className="text-slate-400" /> <span>{job.location}</span></div>
                        <div className="flex items-center gap-2 px-2 border-l border-slate-200/20 text-violet-500">
                          <DollarSign size={16} />
                          <span>
                            {minSalaryVal ? (minSalaryVal === maxSalaryVal ? `${minSalaryVal.toLocaleString()} ${currencySymbol}` : `${minSalaryVal.toLocaleString()} - ${maxSalaryVal.toLocaleString()} ${currencySymbol}`) : "Negotiable"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {job.description && (
                      <div className="mt-5">
                        <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {job.description}
                        </p>
                      </div>
                    )}

                    {pdfAssetUrl && (
                      <div className="mt-4 flex items-center">
                        <a 
                          href={pdfAssetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="Open Job Description PDF Blueprint"
                          className="p-2.5 rounded-xl border transition-all inline-flex items-center justify-center text-rose-500 bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/20 shadow-xs"
                        >
                          <FileText size={20} />
                          <span className="text-xs font-bold ml-2">View JD Document</span>
                        </a>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200/10 mt-6 flex items-center justify-between">
                      <div className="text-xs sm:text-sm text-slate-400 font-medium">
                        Apply before: <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{formatDate(deadlineDate)}</span>
                      </div>
                      
                      <button 
                        disabled={expired} 
                        onClick={() => setSelectedJob(job)} 
                        className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 ${
                          expired 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        {expired ? "Closed" : "Apply for Role"} <ArrowRight size={16} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-24 rounded-2xl border border-dashed ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'} text-sm`}>
              <Info size={28} className="mx-auto mb-2 text-slate-500" />
              No open vacancies match your criteria selections.
            </div>
          )}
        </div>
      </div>

      {/* APPLICATION ENTRY MODAL PORTAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl w-full max-w-lg p-8 relative max-h-[92vh] overflow-y-auto border shadow-2xl transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <button onClick={closeModal} className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-500'}`}><X size={18} /></button>
            
            {!isSuccess ? (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                <div className="border-b border-slate-200/10 pb-3">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">{selectedJob.department} Division</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">{selectedJob.title}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-600 focus:bg-white'}`} placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email Connection</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-600 focus:bg-white'}`} placeholder="johndoe@gmail.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contact Phone</label>
                      <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-600 focus:bg-white'}`} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Resume File Asset (PDF)</label>
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center relative flex flex-col items-center justify-center transition-colors ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                      <input type="file" required accept=".pdf" onChange={(e) => setResumeFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Upload size={24} className="text-slate-400 mb-2" />
                      {resumeFile ? (
                        <p className="text-sm font-bold text-purple-500 truncate max-w-xs">{resumeFile.name}</p>
                      ) : (
                        <p className="text-sm font-semibold text-slate-400">Select or Drop Document Asset</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200/10">
                  <button type="button" onClick={closeModal} className="text-sm font-bold text-slate-400 hover:underline">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm inline-flex items-center gap-1.5">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Uploading...
                      </>
                    ) : 'Submit Profile Application'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Application Transmitted</h3>
                <p className={`text-sm max-w-xs mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your application data stream has parsed into the primary FWC recruitment workspace directory.</p>
                <button onClick={closeModal} className="bg-slate-800 hover:bg-slate-700 transition-colors text-white py-3 rounded-xl text-sm font-bold w-full mt-2">Dismiss Window</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;