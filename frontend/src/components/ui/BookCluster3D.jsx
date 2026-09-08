import React, { useRef, useLayoutEffect } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/motion';

import bookRamayan from '../../assets/Ramayan2.jpeg';
import bookClassroom from '../../assets/krishna_classroom.jpeg';
import bookHanuman from '../../assets/Hanuman_chalisa2.jpeg';

function PremiumBook({ src, alt, className, spineColor, refElement }) {
  return (
    <div 
      ref={refElement}
      className={`absolute ${className} rounded-r-md rounded-l-sm overflow-hidden will-change-transform`}
      style={{
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
      }}
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
    </div>
  );
}

export default function BookCluster3D() {
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const centerRef = useRef(null);
  const rightRef = useRef(null);
  
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    // Mouse parallax for the whole cluster
    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      
      gsap.to(el, {
        rotationY: x * 8,
        rotationX: -y * 8,
        x: x * 10,
        y: y * 10,
        ease: 'power3.out',
        duration: 1
      });
    };
    
    window.addEventListener('mousemove', onMouseMove);

    // Context for animations so they clean up properly
    const ctx = gsap.context(() => {
      const books = [centerRef.current, leftRef.current, rightRef.current];
      
      // 1. Initial State (hidden and clustered down)
      gsap.set(books, { opacity: 0, y: 60, scale: 0.9, rotationZ: 0 });

      // 2. Deal-out Entrance Animation: A fresh, creative "fanning out" effect
      const tl = gsap.timeline({ delay: 0.5 }); // wait slightly for the hero field to appear
      
      // Center comes up first
      tl.to(centerRef.current, { opacity: 1, y: 0, scale: 1, rotationZ: 0, duration: 1.2, ease: 'power3.out' }, 0)
        // Left fans out
        .to(leftRef.current, { opacity: 1, y: 0, scale: 1, rotationZ: -14, duration: 1.2, ease: 'back.out(1.2)' }, 0.15)
        // Right fans out
        .to(rightRef.current, { opacity: 1, y: 0, scale: 1, rotationZ: 14, duration: 1.2, ease: 'back.out(1.2)' }, 0.25);

      // 3. Continuous Breathing/Floating
      // Added smoothly after the entrance timeline
      tl.add(() => {
        const float = (target, yOffset, rotOffset, duration, delay) => {
          gsap.to(target, {
            y: `+=${yOffset}`,
            rotationZ: `+=${rotOffset}`,
            duration: duration,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: delay
          });
        };
        
        // Asynchronous, gentle breathing
        float(centerRef.current, -12, 1, 3.5, 0);
        float(leftRef.current, -8, -1.5, 4.2, 0.5);
        float(rightRef.current, -10, 1.5, 3.8, 1.2);
      });
    }, el);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-20 flex items-center justify-center pointer-events-none" style={{ perspective: '1000px' }}>
      <div 
        ref={containerRef}
        className="relative w-full h-full" 
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Left Book (Classroom) */}
        <PremiumBook 
          refElement={leftRef}
          src={bookClassroom} 
          alt="Classroom Book" 
          className="left-[2%] top-[22%] w-[36%] aspect-[0.635] z-10"
          spineColor="#0a4f22"
        />

        {/* Right Book (Hanuman) */}
        <PremiumBook 
          refElement={rightRef}
          src={bookHanuman} 
          alt="Hanuman Chalisa Book" 
          className="left-[62%] top-[22%] w-[36%] aspect-[0.647] z-20"
          spineColor="#8b1e15"
        />

        {/* Center Book (Ramayan) */}
        <PremiumBook 
          refElement={centerRef}
          src={bookRamayan} 
          alt="Ramayan Book" 
          className="left-[26%] top-[10%] w-[48%] aspect-[0.647] z-30"
          spineColor="#223a5e"
        />
      </div>
    </div>
  );
}
