import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";

// 👑 ADMIN DIRECTORY IMPORTS
import Dashboard from "./pages/Admin/Dashboard";
import EmployeesPage from "./pages/Admin/EmployeesPage";
import AdminAttendance from "./pages/Admin/AdminAttendance";

// 💼 RECRUITER DIRECTORY IMPORTS
import RecruiterDashboard from "./pages/Recruiter/Dashboard";
import InterviewsPage from "./pages/Interview/Interviews.jsx"; 
import JobsPage from "./pages/Recruiter/Jobs.jsx";

// 👥 OTHER ROLE DIRECTORIES
import EmployeeDashboard from "./pages/Employee/Dashboard";
import SeniorManagerDashboard from "./pages/SeniorManager/Dashboard";

function App() {
  return (
    <Routes>
      {/* 🏡 Public Entry Point */}
      <Route path="/" element={<LandingPage />} />

      {/* 👑 Dedicated Admin Operations Workspace Paths */}
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/employees" element={<EmployeesPage />} />
      <Route path="/admin/attendance" element={<AdminAttendance />} />

      {/* 💼 Dedicated Recruiter Workspace Paths */}
      <Route path="/recruiter" element={<RecruiterDashboard />} />
      <Route path="/recruiter/interviews" element={<InterviewsPage />} />
      <Route path="/recruiter/jobs" element={<JobsPage />} />

      {/* 👥 Worker-Facing Directory Hubs */}
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/manager" element={<SeniorManagerDashboard />} />
    </Routes>
  );
}

export default App;