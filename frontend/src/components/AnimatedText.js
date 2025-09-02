// src/components/AnimatedText.js
import { motion } from 'framer-motion';

const AnimatedText = ({ text }) => {
  return (
    <div className="text-7xl font-bold"> {/* Increased font size to 7xl */}
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0.3, filter: 'blur(0.5px)', color: '#FF6B35' }}
          animate={{
            opacity: [0.3, 1, 0.3],
            filter: ['blur(0.5px)', 'blur(0px)', 'blur(0.5px)'],
            color: ['#FF6B35', '#FF8C42', '#FF6B35'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut',
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
};

export default AnimatedText;