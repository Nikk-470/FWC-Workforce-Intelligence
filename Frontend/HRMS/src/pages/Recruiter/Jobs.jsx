import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // 🟢 Form state fields reconstructed to perfectly mirror your original configuration setup
  const [formData, setFormData] = useState({
    title: "",
    location: "Remote",
    jobType: "Full-time",
    experienceLevel: "Mid-level (2-5 years)",
    openingFrom: "",
    openingTo: "",
    salaryStructure: "Fixed Amount",
    currency: "India (INR)",
    fixedSalaryAmount: "",
    keyRequirements: "",
    shortContextDescriptionSummary: ""
  });

  useEffect(() => {
    fetchJobsCatalog();
  }, []);

  const fetchJobsCatalog = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error("Error loading position data matrix:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 🟢 1. Initialize a native browser FormData multi-part encoder instead of standard JSON
      const dataPayload = new FormData();

      // 🟢 2. Append all regular input parameters to the form encoder data track
      dataPayload.append("title", formData.title);
      dataPayload.append("department", "General");
      dataPayload.append("location", formData.location);
      dataPayload.append("type", formData.jobType);
      dataPayload.append("experienceLevel", formData.experienceLevel);
      dataPayload.append("description", formData.shortContextDescriptionSummary);
      dataPayload.append("requirements", formData.keyRequirements);
      dataPayload.append("salaryType", formData.salaryStructure);
      dataPayload.append("minSalary", Number(formData.fixedSalaryAmount) || 0);
      dataPayload.append("maxSalary", Number(formData.fixedSalaryAmount) || 0);
      
      const currencyValue = formData.currency === "India (INR)" ? "INR" : formData.currency === "United States (USD)" ? "USD" : "GBP";
      dataPayload.append("currency", currencyValue);
      
      if (formData.openingFrom) dataPayload.append("openingFrom", formData.openingFrom);
      if (formData.openingTo) dataPayload.append("openingTo", formData.openingTo);

      // 🟢 3. Bind the uploaded file binary stream directly to the exact target variable name your backend reads: "jdPdf"
      if (selectedFile) {
        dataPayload.append("jdPdf", selectedFile);
      }

      // 🟢 4. Dispatch transaction payload using multipart headers
      const res = await axios.post("http://localhost:5000/api/jobs", dataPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      alert("New job opening published successfully!");
      setIsModalOpen(false);

      // Reset Form State
      setFormData({
        title: "",
        location: "Remote",
        jobType: "Full-time",
        experienceLevel: "Mid-level (2-5 years)",
        openingFrom: "",
        openingTo: "",
        salaryStructure: "Fixed Amount",
        currency: "India (INR)",
        fixedSalaryAmount: "",
        keyRequirements: "",
        shortContextDescriptionSummary: ""
      });
      setSelectedFile(null);
      fetchJobsCatalog();
    } catch (error) {
      console.error("Job compilation upload failure:", error);
      alert("Failed to commit career roster parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 text-slate-800 dark:text-slate-100 font-sans space-y-6 max-w-[1600px] mx-auto">
        
        {/* HEADER DASHBOARD BANNER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Corporate Vacancy Indexes</h1>
            <p className="text-xs text-slate-500">Publish, modify, and monitor active operational job openings.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all uppercase tracking-wider"
          >
            ➕ Post New Position
          </button>
        </div>

        {/* ACTIVE GRID INDEX LIST */}
        {/* ACTIVE GRID INDEX LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm space-y-4 relative overflow-hidden"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase">
                  {job.department || "General"}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white pt-1">{job.title}</h3>
                <p className="text-xs text-slate-400 font-medium">{job.location} • {job.type || job.jobType}</p>
              </div>

              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                {job.description}
              </p>

              {/* 🟢 ADDED: Dynamic Applied Before Badge */}
              {(() => {
                const targetDate = job.openingTo || job.openingToDate || job.closingDate;
                if (!targetDate) return null;

                try {
                  const formattedDate = new Date(targetDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-1 rounded-lg w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>Applied Before:</span>
                      <span className="font-bold">{formattedDate}</span>
                    </div>
                  );
                } catch (err) {
                  return null;
                }
              })()}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400">
                <span>Compensation Node:</span>
                <span>
                  {job.currency} {Number(job.minSalary).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="col-span-full bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <p className="text-sm text-slate-400 italic">No structured career vacancy metrics found on database files.</p>
            </div>
          )}
        </div>

        {/* 🟢 RECONSTRUCTED POPUP MODAL (Matches original visual references perfectly) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Post New Job Opening</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Initialize parameters for live applicant ingestion.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
                {/* Row 1: Title & Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Job Title / Branches</label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="CSE, ECE"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Location Profile</label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="Remote / Bengaluru"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 2: Job Type & Experience Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Job Type</label>
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Experience Level</label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                    >
                      <option value="Entry-level (0-1 years)">Entry-level (0-1 years)</option>
                      <option value="Mid-level (2-5 years)">Mid-level (2-5 years)</option>
                      <option value="Senior-level (5+ years)">Senior-level (5+ years)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Timelines */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Opening From</label>
                    <input
                      type="date"
                      name="openingFrom"
                      value={formData.openingFrom}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-600 dark:text-slate-300 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Opening To</label>
                    <input
                      type="date"
                      name="openingTo"
                      value={formData.openingTo}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-600 dark:text-slate-300 outline-none"
                    />
                  </div>
                </div>

                {/* Row 4: Salary Structure Parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Salary Structure</label>
                    <select
                      name="salaryStructure"
                      value={formData.salaryStructure}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none"
                    >
                      <option value="Fixed Amount">Fixed Amount</option>
                      <option value="Hourly Range">Hourly Range</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Currency Dropdown</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none"
                    >
                      <option value="India (INR)">India (INR)</option>
                      <option value="United States (USD)">United States (USD)</option>
                      <option value="United Kingdom (GBP)">United Kingdom (GBP)</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Numeric Compensation Entry */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fixed Salary Amount</label>
                  <input
                    type="number"
                    name="fixedSalaryAmount"
                    required
                    placeholder="1000000"
                    value={formData.fixedSalaryAmount}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Row 6: File Asset Upload Component */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Upload Job Description File (PDF)</label>
                  <div className="flex items-center justify-between border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/40">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-slate-500 dark:text-slate-400 text-[11px]"
                    />
                    {selectedFile && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">📄 Loaded</span>}
                  </div>
                </div>

                {/* Row 7: Requirements Keywords */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Key Requirements (Comma-Separated for AI Matching)</label>
                  <input
                    type="text"
                    name="keyRequirements"
                    placeholder="React, Node.js, TypeScript, AWS"
                    value={formData.keyRequirements}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Row 8: Core Description Frame */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Short Context Description Summary</label>
                  <textarea
                    name="shortContextDescriptionSummary"
                    rows="3"
                    required
                    placeholder="Software Developer details..."
                    value={formData.shortContextDescriptionSummary}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500 resize-none text-[11px]"
                  />
                </div>

                {/* Modal Layout Action Operations Footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="border border-slate-200 dark:border-slate-800 text-slate-500 font-bold px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    {isLoading ? "Publishing..." : "Publish Posting"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}