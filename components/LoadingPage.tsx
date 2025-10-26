import React from 'react';
import { motion } from 'framer-motion';

const LoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d1a] via-[#1c1c24] to-[#0d0d1a] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#f4a261]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-[#e76f51]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f4a261] to-[#e76f51]">
            Ahmad Agent
          </h1>
        </motion.div>
        
        {/* Loading animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-12"
        >
          <div className="w-24 h-24 border-4 border-[#f4a261]/30 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-t-[#e76f51] border-r-[#f4a261] border-b-[#f4a261] border-l-[#e76f51] rounded-full animate-spin"></div>
          </div>
          
          {/* Pulsing center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-3 h-3 bg-[#f4a261] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
        
        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-zinc-300 text-lg mb-2">Initializing AI systems</p>
          <div className="flex space-x-2 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[#f4a261] rounded-full"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 w-64 h-1 bg-zinc-800 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-[#f4a261] to-[#e76f51]"
            initial={{ width: '0%' }}
            animate={{ width: '75%' }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </motion.div>
      </div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0wIDBoNnY2SDB6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDMwKSIgZmlsbD0icmdiYSgxOTYsMTQ3LDExOSwwLjAyKSIvPgo8L3N2Zz4K')] opacity-20"></div>
    </div>
  );
};

export default LoadingPage;