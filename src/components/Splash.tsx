import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/onboardingStore";

const Splash = () => {
  const setStep = useStore((state) => state.setStep);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [setStep]);

  return (
    <motion.div
      className="min-h-screen bg-[#E2EBFF] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.h1
          className="text-6xl font-bold text-[#040F34] mb-4"
          animate={{
            textShadow: [
              "0 0 20px rgba(0,45,203,0)",
              "0 0 20px rgba(0,45,203,0.5)",
              "0 0 20px rgba(0,45,203,0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Welcome to the Helios Testnet
        </motion.h1>
        <div className="w-24 h-24 mx-auto">
          <div className="animate-spin rounded-full h-full w-full border-b-2 border-[#002DCB]"></div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Splash;
