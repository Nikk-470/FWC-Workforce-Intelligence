import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

// 1. IMPORT YOUR ROUTING LAYOUT ALIASES
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const AdminAttendance = ({ isDarkMode }) => {
  const [csvData, setCsvData] = useState([]);
  const [rawFile, setRawFile] = useState(null); // Keeps track of the file instance for the backend post
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success, error, synced
  const [syncMessage, setSyncMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRawFile(file);
    setUploadStatus('processing');

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = ['employee_id', 'date', 'clock_in', 'clock_out'];
        const hasHeaders = requiredHeaders.every(header => results.meta.fields.includes(header));

        if (hasHeaders) {
          setCsvData(results.data);
          setUploadStatus('success');
          setSyncMessage('');
        } else {
          setUploadStatus('error');
          setRawFile(null);
          alert("Invalid CSV Format! Spreadsheet must contain columns: employee_id, date, clock_in, clock_out");
        }
      },
      error: (error) => {
        console.error("Parsing Error:", error);
        setUploadStatus('error');
      }
    });
  };

  // 📡 NEW: Dispatch Multipart Form Data Matrix to the backend route
  const handleCommitAndSync = async () => {
    if (!rawFile) return;

    try {
      setUploadStatus('processing');
      const token = localStorage.getItem("fwc_token");
      
      const formData = new FormData();
      formData.append('file', rawFile); // Matches upload.single("file") signature exactly

      const res = await axios.post('Frontend/HRMS/src/**/api/attendance/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setUploadStatus('synced');
        setSyncMessage(res.data.message || 'Biometric rows mapped successfully!');
        setCsvData([]); // Clear staging array after successful persistence
        setRawFile(null);
      }
    } catch (err) {
      console.error("Failed syncing logs to database engine:", err);
      setUploadStatus('error');
      alert(err.response?.data?.message || "Server error transmitting attendance payload.");
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader />

      <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn mt-6">
        
        {/* HEADER BAR */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-blue-600" size={22} /> Biometric Data Terminal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Bulk upload raw punch machine machine text logs via CSV spreadsheets.</p>
        </div>

        {/* DRAG & DROP UPLOAD SLOT ZONE */}
        <div className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all relative ${
          isDarkMode 
            ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' 
            : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
        }`}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploadStatus === 'processing'}
          />
          
          <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-500">
              <UploadCloud size={28} />
            </div>
            <div>
              <p className="text-sm font-bold">Click to upload or drag biometric CSV here</p>
              <p className="text-[11px] text-slate-400 mt-1">Accepts standard log sheets parsed from Wi-Fi hardware devices</p>
            </div>
          </div>
        </div>

        {/* DYNAMIC UPLOAD ALERTS BLOCK */}
        {uploadStatus === 'processing' && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-xs text-blue-500 font-medium animate-pulse">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Processing and transmitting biometric logs into database pipeline...</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-xs text-green-600 font-medium">
            <CheckCircle2 size={16} />
            <p>Successfully processed preview block. Found <span className="font-bold">{csvData.length}</span> unique logs ready to sync.</p>
          </div>
        )}

        {uploadStatus === 'synced' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-600 font-medium">
            <CheckCircle2 size={16} />
            <p>{syncMessage || "Database synchronization step completed successfully!"}</p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-xs text-red-500 font-medium">
            <AlertTriangle size={16} />
            <p>Operational Sync Failure. Please verify row schemas and template alignments.</p>
          </div>
        )}

        {/* PREVIEW STAGING TABLE CONTAINER */}
        {csvData.length > 0 && (
          <div className={`rounded-2xl border p-5 shadow-lg ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <FileSpreadsheet size={14} /> Staging Log Buffer Data Preview
            </h3>
            
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-bold text-slate-400 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <th className="pb-3 px-3">Employee ID</th>
                    <th className="pb-3 px-3">Log Date</th>
                    <th className="pb-3 px-3">Clock In Time</th>
                    <th className="pb-3 px-3">Clock Out Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium text-slate-600 dark:text-slate-300">
                  {csvData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono text-blue-500">{row.employee_id}</td>
                      <td className="py-3 px-3">{row.date}</td>
                      <td className="py-3 px-3 text-green-600 dark:text-green-400">{row.clock_in}</td>
                      <td className="py-3 px-3 text-red-400">{row.clock_out}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-5 pt-4 border-t dark:border-slate-900 border-slate-100 flex justify-end">
              <button 
                onClick={handleCommitAndSync} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Commit & Sync Logs to Employees
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminAttendance;