import { motion } from "framer-motion";

export default function FloatingAvatar() {
  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
      }}
      className="flex justify-center"
    >
      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-7xl shadow-2xl">
        🤖
      </div>
    </motion.div>
  );
}