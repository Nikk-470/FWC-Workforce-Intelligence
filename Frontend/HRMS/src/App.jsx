import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";
import CareersPage from "./pages/CareersPage/CareersPage";
import InterviewsPage from "./pages/interview/Interviews.jsx";
import AIInterviewSandboxApp from "./pages/interview/AIInterviewSandboxApp.jsx";

// 👑 ADMIN DIRECTORY IMPORTS (Fixed to lowercase 'admin')
import AdminDashboard from "./pages/admin/Dashboard"; 
import EmployeesPage from "./pages/admin/EmployeesPage";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminPaymentPanel from "./pages/admin/AdminPaymentPanel"; 

// 💼 RECRUITER DIRECTORY IMPORTS (Fixed to lowercase 'recruiter')
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import JobsPage from "./pages/recruiter/Jobs.jsx";

// 👥 OTHER ROLE DIRECTORIES (Fixed to lowercase 'employee' and 'seniormanager')
import EmployeeDashboard from "./pages/employee/Dashboard";
import SeniorManagerDashboard from "./pages/seniormanager/Dashboard";
// At the top of App.jsx
import JobPipelineDetails from "./pages/recruiter/JobPipelineDetails"; // Ensure this path matches where you saved the file

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
      
      {/* 🎙️ Interactive Applicant Assessment Loop (Public Token Ingress) */}
      <Route path="/interview/session/:token" element={<AIInterviewSandboxApp />} />

      {/* 👑 Dedicated Admin Operations Workspace Paths */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
      <Route path="/admin/payment" element={<ProtectedRoute><AdminPaymentPanel /></ProtectedRoute>} />

      {/* 💼 Dedicated Recruiter Workspace Paths */}
      <Route path="/recruiter" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/interviews" element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
      
      {/* 🟢 FIXED AND ALIGNED WITH YOUR SIDEBAR ARRAYS:
          This route loads your RecruiterDashboard file where the new candidate pipeline tables and grading loops sit! */}
      <Route path="/recruiter/pipeline" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/pipeline/:jobId" element={<JobPipelineDetails />} />

      {/* 👥 Worker-Facing Directory Hubs */}
      <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute><SeniorManagerDashboard /></ProtectedRoute>} />

      {/* 🚫 Catch-All Routing Safety Valve (MUST REMAIN AT THE BOTTOM) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;