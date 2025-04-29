import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MascotProps {
  text: string;
  onTypingComplete: () => void;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  buttonText: string;
  loadingText?: string;
  isLoading?: boolean;
}

const Mascot: React.FC<MascotProps> = ({
  text,
  onTypingComplete,
  currentStep,
  totalSteps,
  onNext,
  buttonText,
  loadingText,
  isLoading,
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
          className="absolute -top-28 text-black font-bold text-xl"
        >
          Step {currentStep}
          <span className="text-gray-400"> / {totalSteps}</span>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center">
          {/* Floating Mascot */}
          <img
            src="/images/Avatar1.png"
            alt="logo"
            className="w-60 aspect-auto text-white"
          />

          {/* Message Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-sm mx-auto sm:mt-5 -mt-20 relative"
          >
            <div className="bg-white rounded-2xl p-6 shadow-xl relative z-10 min-h-52 mx-4">
              <div className="relative">
                <div className="text-[#040F34] text-lg leading-relaxed">
                  {displayedText}
                  {currentIndex < text.length ? (
                    <motion.span
                      className="inline-block w-2 h-5 bg-[#002DCB] ml-1"
                      animate={{ opacity: [0, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  ) : (
                    <div>
                      <motion.button
                        onClick={onNext}
                        disabled={isLoading}
                        className={`mt-6 px-6 py-3 bg-[#002DCB] text-white rounded-full text-base font-semibold transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                          !isLoading
                            ? "hover:opacity-90 hover:scale-105 hover:shadow-xl"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        whileHover={!isLoading ? { scale: 1.05 } : {}}
                        whileTap={!isLoading ? { scale: 0.95 } : {}}
                      >
                        {isLoading ? loadingText || "Loading..." : buttonText}
                      </motion.button>
                    </div>
                  )}
                </div>
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
    </div>
  );
};

export default Mascot;
