import React, { useState, useEffect } from "react";
import { Sun } from "lucide-react";
import { motion } from "framer-motion";

interface MascotProps {
  text: string;
  onTypingComplete: () => void;
  currentStep: number;
  totalSteps: number;
}

const Mascot: React.FC<MascotProps> = ({
  text,
  onTypingComplete,
  currentStep,
  totalSteps,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 30);

      return () => clearTimeout(timer);
    } else {
      onTypingComplete();
    }
  }, [currentIndex, text, onTypingComplete]);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Progress Steps */}
      <div className="absolute -top-16 left-0 right-0 flex justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 w-12 rounded-full ${
              index < currentStep ? "bg-[#002DCB]" : "bg-[#002DCB]/20"
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>

      <div className="flex justify-center items-center w-full mb-8">
        {/* Step Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-28 text-[#002DCB] font-medium"
        >
          Step {currentStep}/{totalSteps}
        </motion.div>

        {/* Floating Mascot */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            scale: { duration: 0.5 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-[#002DCB] to-[#0045FF] rounded-full flex items-center justify-center shadow-lg shadow-[#002DCB]/20">
            <Sun className="w-16 h-16 text-white" />
          </div>

          {/* Orbiting particles */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0"
          >
            {[0, 120, 240].map((degree) => (
              <motion.div
                key={degree}
                className="absolute w-3 h-3 bg-white rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${degree}deg) translate(60px) rotate(-${degree}deg)`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: degree / 360,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Message Bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full mx-auto mt-8 relative"
        >
          <div className="bg-white rounded-2xl p-6 shadow-xl relative z-10">
            <div className="relative">
              <p className="text-[#040F34] text-lg leading-relaxed">
                {displayedText}
              </p>
              {currentIndex < text.length && (
                <motion.span
                  className="inline-block w-2 h-5 bg-[#002DCB] ml-1"
                  animate={{ opacity: [0, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -z-10 inset-0 bg-gradient-to-r from-[#002DCB]/10 to-[#0045FF]/10 rounded-2xl blur-xl"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Mascot;
