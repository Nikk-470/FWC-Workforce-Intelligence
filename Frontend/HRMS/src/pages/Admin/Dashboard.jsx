import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import AIChatBot from "@/components/ai/AIChatBot";
import FWCAIWidget from "@/components/ai/FWCAIWidget";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader />

      {/* Stat Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Employees" value="5,247" />

        <StatCard title="Attendance" value="98.4%" />

        <StatCard title="Open Positions" value="324" />

        <StatCard
          title="AI Screening"
          value="Active"
          color="text-green-600"
        />
      </div>

      {/* AI Insights + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold mb-4">
            AI Workforce Insights
          </h2>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50">
              Resume screening efficiency increased by 18%
            </div>

            <div className="p-3 rounded-xl bg-slate-50">
              Attendance anomaly detected in Sales Department
            </div>

            <div className="p-3 rounded-xl bg-slate-50">
              12 candidates shortlisted automatically
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold mb-4">
            Recent Activity
          </h2>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50">
              New employee onboarded
            </div>

            <div className="p-3 rounded-xl bg-slate-50">
              Payroll processed successfully
            </div>

            <div className="p-3 rounded-xl bg-slate-50">
              New job posting created
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIChatBot />
      <FWCAIWidget />
    </DashboardLayout>
  );
}