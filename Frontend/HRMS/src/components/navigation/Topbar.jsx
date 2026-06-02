import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header
      className="
        h-16
        bg-white
        border-b
        flex
        items-center
        justify-between
        px-6
      "
    >
      <div>
  <h1 className="font-semibold text-xl">
    Admin Dashboard
  </h1>

  <p className="text-sm text-slate-500">
    Workforce Operations Overview
  </p>
</div>

      <div className="flex items-center gap-4">

        <button className="p-2 rounded-lg hover:bg-slate-100">
          <Bell size={20} />
        </button>

        <div
          className="
            w-10
            h-10
            rounded-full
            bg-indigo-600
            text-white
            flex
            items-center
            justify-center
            font-bold
          "
        >
          N
        </div>

      </div>
    </header>
  );
}