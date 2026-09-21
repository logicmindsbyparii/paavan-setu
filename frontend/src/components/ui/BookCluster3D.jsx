import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

import bookRamayan from '../../assets/Ramayan2.jpeg';
import bookClassroom from '../../assets/krishna_classroom.jpeg';
import bookHanuman from '../../assets/Hanuman_chalisa2.jpeg';

const PremiumBook = React.forwardRef(({ src, alt, className, spineColor, custom, initial, animate, transition, style }, ref) => {
  return (
    <motion.div 
      ref={ref}
      custom={custom}
      initial={initial}
      animate={animate}
      transition={transition}
      style={{
        ...style,
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
      }}
      className={`absolute ${className} rounded-r-md rounded-l-sm overflow-hidden will-change-transform`}
    >
      {/* Spine simulation: Multiplies a deep color over the left edge to simulate a cloth binding */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[5%] z-20 pointer-events-none mix-blend-multiply" 
        style={{ 
          backgroundColor: spineColor,
          boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.4), inset 1px 0 2px rgba(255,255,255,0.3)' 
        }}
      />
      {/* Book hinge shadow */}
      <div className="absolute left-[5%] top-0 bottom-0 w-[4%] z-20 pointer-events-none bg-gradient-to-r from-black/30 to-transparent mix-blend-overlay" />
      {/* Cover lighting */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-black/20 via-transparent to-white/10 mix-blend-overlay" />
      
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover relative z-0" 
        style={{ imageRendering: 'high-quality', transform: 'translateZ(0)' }} 
      />
    </motion.div>
  );
});

export default function BookCluster3D() {
  const reducedMotion = useReducedMotion();

  // Mouse parallax setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotationY = useTransform(smoothX, [-1, 1], [-8, 8]);
  const rotationX = useTransform(smoothY, [-1, 1], [8, -8]);
  const translateX = useTransform(smoothX, [-1, 1], [-10, 10]);
  const translateY = useTransform(smoothY, [-1, 1], [-10, 10]);

  useEffect(() => {
    if (reducedMotion) return;
    
    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      
      mouseX.set(x);
      mouseY.set(y);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [mouseX, mouseY, reducedMotion]);

  // Entrance animations for books
  const getInitial = () => {
    return reducedMotion ? { opacity: 1, y: 0, scale: 1, rotateZ: 0 } : { opacity: 0, y: 60, scale: 0.9, rotateZ: 0 };
  };

  const getAnimate = (finalRotateZ) => {
    if (reducedMotion) {
      return { opacity: 1, y: 0, scale: 1, rotateZ: finalRotateZ };
    }
    return {
      opacity: 1,
      y: [null, 0],
      scale: [null, 1],
      rotateZ: [null, finalRotateZ],
      // We rely on standard transition for the entry, and then CSS-like repeating animation for breathing.
    };
  };

  // For the breathing floating animation we can use a separate animate definition
  const getFloatingAnimate = (finalRotateZ, yOffset, rotOffset, duration, delay) => {
    if (reducedMotion) return getAnimate(finalRotateZ);
    return {
      opacity: 1,
      scale: 1,
      y: [60, 0, yOffset, 0], 
      rotateZ: [0, finalRotateZ, finalRotateZ + rotOffset, finalRotateZ],
      transition: {
        opacity: { duration: 1.2, delay: 0.5 },
        scale: { duration: 1.2, delay: 0.5, ease: 'easeOut' },
        y: { 
          times: [0, 0.2, 0.6, 1], 
          duration: duration + 1.2, 
          delay: 0.5 + delay,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        },
        rotateZ: { 
          times: [0, 0.2, 0.6, 1], 
          duration: duration + 1.2, 
          delay: 0.5 + delay,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }
      }
    };
  };

  // Alternative simpler floating approach: animate to normal position, then use Framer Motion's repeating transitions.
  const centerAnim = reducedMotion ? getAnimate(0) : {
    opacity: 1, y: [60, 0, -12], scale: 1, rotateZ: [0, 0, 1],
    transition: {
      opacity: { duration: 1.2, delay: 0.5, ease: "easeOut" },
      scale: { duration: 1.2, delay: 0.5, ease: "easeOut" },
      y: { delay: 0.5, duration: 1.2, ease: "easeOut" },
      rotateZ: { delay: 0.5, duration: 1.2, ease: "easeOut" }
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full z-20 flex items-center justify-center pointer-events-none" style={{ perspective: '1000px' }}>
      <motion.div 
        className="relative w-full h-full" 
        style={{ 
          transformStyle: 'preserve-3d',
          rotateX: reducedMotion ? 0 : rotationX,
          rotateY: reducedMotion ? 0 : rotationY,
          x: reducedMotion ? 0 : translateX,
          y: reducedMotion ? 0 : translateY
        }}
      >
        {/* Left Book (Classroom) */}
        <PremiumBook 
          src={bookClassroom} 
          alt="Classroom Book" 
          className="left-[2%] top-[22%] w-[36%] aspect-[0.635] z-10"
          spineColor="#0a4f22"
          initial={getInitial()}
          animate={reducedMotion ? getAnimate(-14) : {
            opacity: 1, y: [60, 0, -8], scale: 1, rotateZ: [0, -14, -15.5]
          }}
          transition={reducedMotion ? {} : {
            opacity: { duration: 1.2, delay: 0.65, ease: [0.175, 0.885, 0.32, 1.275] },
            scale: { duration: 1.2, delay: 0.65, ease: [0.175, 0.885, 0.32, 1.275] },
            y: { delay: 0.65, duration: 1.2, ease: [0.175, 0.885, 0.32, 1.275] },
            rotateZ: { delay: 0.65, duration: 1.2, ease: [0.175, 0.885, 0.32, 1.275] }
          }}
        />

        {/* Right Book (Hanuman) */}
        <PremiumBook 
          src={bookHanuman} 
          alt="Hanuman Chalisa Book" 
          className="left-[62%] top-[22%] w-[36%] aspect-[0.647] z-20"
          spineColor="#8b1e15"
          initial={getInitial()}
          animate={reducedMotion ? getAnimate(14) : {
            opacity: 1, y: [60, 0, -10], scale: 1, rotateZ: [0, 14, 15.5]
          }}
          transition={reducedMotion ? {} : {
            opacity: { duration: 1.2, delay: 0.75, ease: [0.175, 0.885, 0.32, 1.275] },
            scale: { duration: 1.2, delay: 0.75, ease: [0.175, 0.885, 0.32, 1.275] },
            y: { delay: 0.75, duration: 1.2, ease: [0.175, 0.885, 0.32, 1.275] },
            rotateZ: { delay: 0.75, duration: 1.2, ease: [0.175, 0.885, 0.32, 1.275] }
          }}
        />

        {/* Center Book (Ramayan) */}
        <PremiumBook 
          src={bookRamayan} 
          alt="Ramayan Book" 
          className="left-[26%] top-[10%] w-[48%] aspect-[0.647] z-30"
          spineColor="#223a5e"
          initial={getInitial()}
          animate={centerAnim}
        />
      </motion.div>
    </div>
  );
}

