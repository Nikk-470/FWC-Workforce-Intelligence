export default function AIChatBot() {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
  
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">
            HERA AI Assistant
          </h2>
  
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            Online
          </span>
        </div>
  
        <div className="space-y-3 mb-5">
  
          <div className="p-3 rounded-xl bg-slate-50">
            🔍 Screen top candidates for Software Engineer role
          </div>
  
          <div className="p-3 rounded-xl bg-slate-50">
            📊 Generate monthly HR report
          </div>
  
          <div className="p-3 rounded-xl bg-slate-50">
            ⚠ Detect attendance anomalies
          </div>
  
          <div className="p-3 rounded-xl bg-slate-50">
            🎯 Recommend employees for promotion
          </div>
  
        </div>
  
        <div className="flex gap-3">
  
          <input
            type="text"
            placeholder="Ask HERA AI..."
            className="
              flex-1
              border
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          />
  
          <button
            className="
              bg-indigo-600
              text-white
              px-5
              rounded-xl
              hover:bg-indigo-700
              transition
            "
          >
            Send
          </button>
  
        </div>
  
      </div>
    );
  }