import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function PortalCard({
  title,
  description,
  icon,
  route,
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.2,
      }}
    >
      <Card className="cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all rounded-3xl">
        <CardContent className="p-8 text-center">

          <motion.div
            className="h-28 flex items-center justify-center mb-4"
            whileHover={{
              scale: 1.15,
              y: -4,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
            }}
          >
            {typeof icon === "string" ? (
              <span className="text-7xl">{icon}</span>
            ) : (
              icon
            )}
          </motion.div>

          <h2 className="text-2xl font-bold mb-3">
            {title}
          </h2>

          <p className="text-slate-500">
            {description}
          </p>

          <button
  onClick={() => navigate(route)}
  className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
>
  Enter Workspace →
</button>

        </CardContent>
      </Card>
    </motion.div>
  );
}