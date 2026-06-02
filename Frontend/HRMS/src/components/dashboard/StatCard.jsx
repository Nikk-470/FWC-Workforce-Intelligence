export default function StatCard({
    title,
    value,
    color = "text-black",
  }) {
    return (
        <div className="
        bg-white
        rounded-3xl
        p-6
        shadow-lg
        border
        border-slate-100
        hover:shadow-2xl
        hover:-translate-y-1
        transition-all
        duration-300
      ">
        <p className="text-slate-500">
          {title}
        </p>
  
        <h2 className={`text-3xl font-bold mt-2 ${color}`}>
          {value}
        </h2>
      </div>
    );
  }