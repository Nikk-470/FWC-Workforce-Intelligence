  import PortalCard from "@/components/landing/PortalCard";
  import recruiterimg from "@/assets/recruiterimg.png";
  import employee from "@/assets/employee.png";

  import {
    ShieldCheck,
    BarChart3,
    Briefcase,
    Users,
  } from "lucide-react";
  export default function LandingPage() {
    return (
      <div className="relative min-h-screen bg-slate-50 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"></div>

  <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>

        {/* Navbar */}
        <nav className="border-b bg-white">
    <div className="w-full px-2 sm:px-8 py-4 flex justify-between items-center">

      <div className="pl-0 sm:pl-4 lg:pl-8">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
          FWC Workforce Intelligence
        </h1>

        <p className="text-xs sm:text-sm text-slate-500">
          AI-Powered Workforce Platform
        </p>
      </div>
      <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
    AI Enabled
  </div>

    </div>
  </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

         {/* Welcome Section */}
<div className="text-center mb-10 sm:mb-12">

<h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
  Welcome to FWC Workforce Intelligence
</h2>

<p className="text-slate-500 mt-3 text-base sm:text-lg max-w-3xl mx-auto">
  Unified platform for workforce management, recruitment,
  analytics and employee engagement.
</p>

</div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <PortalCard
              icon={<ShieldCheck size={70} className="text-blue-600" />}
              title="Admin"
              description="Manage organization, analytics and workforce operations."
            />

            <PortalCard
              icon={<BarChart3 size={70} className="text-purple-600" />}
              title="Senior Manager"
              description="Track team performance and department insights."
            />

            <PortalCard
              icon={
                <img
                  src={recruiterimg}
                  alt="Recruiter"
                  className="w-24 h-24 object-contain"
                />
              }
              title="Recruiter"
              description="Screen resumes and conduct AI interviews."
            />

            <PortalCard
              icon={
                <img
                  src={employee}
                  alt="Employee"
                  className="w-24 h-24 object-contain"
                />
              }
              title="Employee"
              description="Attendance, payroll and performance tracking."
            />

          </div>

          {/* System Overview */}
          <div className="mt-16">
          <div className="mb-8 bg-white rounded-3xl p-5 shadow-lg border border-slate-100">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
      
      <div>
        <h3 className="font-bold text-lg">
          HERA AI Status
        </h3>

        <p className="text-slate-500 text-sm">
          Resume Screening • Voice Analysis • Workforce Insights
        </p>
      </div>

      <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
        Active
      </span>

    </div>
  </div>
            <h3 className="text-2xl font-bold mb-6">
              System Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <p className="text-slate-500">Employees</p>
                <h2 className="text-3xl font-bold">5,247</h2>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <p className="text-slate-500">Attendance</p>
                <h2 className="text-3xl font-bold">98.4%</h2>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <p className="text-slate-500">Open Positions</p>
                <h2 className="text-3xl font-bold">324</h2>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <p className="text-slate-500">AI Screening</p>
                <h2 className="text-3xl font-bold text-green-600">
                  Active
                </h2>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }