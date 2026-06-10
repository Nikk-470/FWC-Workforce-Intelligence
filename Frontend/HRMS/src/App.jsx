import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";
import CareersPage from "./pages/CareersPage/CareersPage";
import InterviewsPage from "./pages/Interview/Interviews.jsx";

// 👑 ADMIN DIRECTORY IMPORTS 
import AdminDashboard from "./pages/Admin/Dashboard"; 
import EmployeesPage from "./pages/Admin/EmployeesPage";
import AdminAttendance from "./pages/Admin/AdminAttendance";
import AdminPaymentPanel from "./pages/Admin/AdminPaymentPanel"; 

// 💼 RECRUITER DIRECTORY IMPORTS 
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import JobsPage from "./pages/recruiter/Jobs.jsx";
import JobPipelineDetails from "./pages/recruiter/JobPipelineDetails"; 

// 👥 OTHER ROLE DIRECTORIES (Fixed to match your exact sidebar capitalization)
import EmployeeDashboard from "./pages/Employee/Dashboard";
import SeniorManagerDashboard from "./pages/SeniorManager/Dashboard";

// 🛡️ Client-Side Session Guardian Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("fwc_token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* 🏡 Public Entry Point */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/careers" element={<CareersPage />} />
      
      {/* 🎙️ Interactive Applicant Assessment Loop (Commented out because file was deleted) */}
      {/* <Route path="/interview/session/:token" element={<AIInterviewSandboxApp />} /> */}

      {/* 👑 Dedicated Admin Operations Workspace Paths */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
      <Route path="/admin/payment" element={<ProtectedRoute><AdminPaymentPanel /></ProtectedRoute>} />

      {/* 💼 Dedicated Recruiter Workspace Paths */}
      <Route path="/recruiter" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/interviews" element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
      
      <Route path="/recruiter/pipeline" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/pipeline/:jobId" element={<JobPipelineDetails />} />

      {/* 👥 Worker-Facing Directory Hubs */}
      <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute><SeniorManagerDashboard /></ProtectedRoute>} />

      {/* 🚫 Catch-All Routing Safety Valve */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;