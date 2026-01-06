'use client';

import { motion } from 'framer-motion';

export const AnimatedButton = ({ children, onClick, variant = 'primary', ...props }) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
        };
      case 'secondary':
        return {
          backgroundColor: '#808080',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
        };
      case 'outline':
        return {
          backgroundColor: 'white',
          color: '#2563eb',
          border: '2px solid #2563eb',
          borderRadius: '12px',
        };
      default:
        return {
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
        };
    }
  };

  return (
    <motion.button
      onClick={onClick}
      style={getButtonStyle()}
      className="px-6 py-2 font-semibold transition duration-200"
      whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const AnimatedCard = ({ children, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: '-100px' }}
      className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition"
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedSection = ({ children, delay = 0, ...props }) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export const AnimatedHeading = ({ children, delay = 0, ...props }) => {
  return (
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      {...props}
    >
      {children}
    </motion.h1>
  );
};

export const AnimatedText = ({ children, delay = 0, ...props }) => {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      {...props}
    >
      {children}
    </motion.p>
  );
};

export const AnimatedContainer = ({ children, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
