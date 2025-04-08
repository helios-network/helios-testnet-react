import React from "react";
import { motion } from "framer-motion";
import { Sun } from "lucide-react";

interface XPToastProps {
  amount: number;
  message: string;
}

const XPToast: React.FC<XPToastProps> = ({ amount, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center"
    >
      <Sun className="w-6 h-6 text-[#002DCB] mr-2" />
      <div>
        <p className="font-bold text-[#040F34]">+{amount} XP</p>
        <p className="text-sm text-[#5C6584]">{message}</p>
      </div>
    </motion.div>
  );
};

export default XPToast;
