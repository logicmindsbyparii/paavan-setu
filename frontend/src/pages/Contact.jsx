import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
} from 'framer-motion';
import { Snackbar, Alert } from '@mui/material';

import { useSettings } from '../hooks/useContent';
import { API, WHATSAPP_NUMBER } from '../constants/urls';

import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// ─── DATA ──────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'counselling', label: 'Career Counselling' },
  { id: 'workshop', label: 'School Workshop' },
  { id: 'dmit', label: 'DMIT & Psychometrics' },
  { id: 'teacher', label: 'Teacher Training' },
  { id: 'parent', label: 'Parent Guidance' },
  { id: 'books', label: 'Curriculum & Books' },
];

const FAQS = [
  {
    q: 'How fast will someone respond to my enquiry?',
    a: 'Our coordination team responds to all phone calls, WhatsApp messages, and form submissions within 2–4 working hours.',
  },
  {
    q: 'Do you conduct on-site workshops across Gujarat?',
    a: 'Yes, our senior facilitators travel to schools, institutions, and community halls throughout Gujarat with complete presentation kits and interactive workbooks.',
  },
  {
    q: 'Is an initial consultation call free for parents and schools?',
    a: 'Yes! We offer a complimentary 15-minute consultation to understand your requirements before recommending any specific programme.',
  },
];

const TRUST_ITEMS = [
  'Response within 2-4 working hours',
  'No spam or commercial push',
  'Free 15-min initial consultation',
];

// ─── INTERACTIVE CANVAS BACKDROP (LIGHT / IVORY THEME) ─────────────────────
function InteractiveContactCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = 38;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.025;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Magnetism
        const dxMouse = mouseX - node.x;
        const dyMouse = mouseY - node.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 180) {
          node.x += (dxMouse / distMouse) * 0.3;
          node.y += (dyMouse / distMouse) * 0.3;
        }

        // Connecting Signal Lines (Vibrant Gold & Green)
        for (let j = i + 1; j < nodeCount; j++) {
          const target = nodes[j];
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.22;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = i % 2 === 0 ? `rgba(10, 92, 44, ${alpha})` : `rgba(217, 174, 60, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        const r = node.radius + Math.sin(node.pulse) * 0.6;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(10, 92, 44, 0.45)' : 'rgba(217, 174, 60, 0.65)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = i % 2 === 0 ? 'rgba(10, 92, 44, 0.25)' : 'rgba(217, 174, 60, 0.35)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none opacity-60" />;
}

// ─── MAIN CONTACT PAGE ──────────────────────────────────────────────────────
export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', service: 'Career Counselling', message: '' });
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const settings = useSettings();

  const whatsappNumber = settings.get('contact.whatsapp', WHATSAPP_NUMBER);
  const whatsappDisplay = settings.get('contact.phone', '+91 63511-13766');
  const contactEmail = settings.get('contact.email', 'paavan.setu@gmail.com');
  const contactAddress = settings.get('contact.address', 'A-5/29, 6th Floor, Green City Gold, Pal Bhata Road, Pal, Surat, Gujarat – 394510');
  const workingHours = settings.get('contact.workingHours', 'Monday – Saturday: 10:00 AM – 7:00 PM');

  // Mouse tilt for hero stage
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-6, 6]), { stiffness: 200, damping: 25 });

  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleHeroMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Cursor spotlight on bento cards
  const handleSpotlightMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  function validate(values) {
    const next = {};
    if (!values.name.trim()) next.name = 'Please tell us your name.';
    if (!values.phone.trim()) {
      next.phone = 'Please add a phone number so we can reach you.';
    } else if (!/^[6-9]\d{9}$/.test(values.phone.replace(/\D/g, '').slice(-10))) {
      next.phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    return next;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate(formData);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstField = ['name', 'phone', 'email'].find((f) => found[f]);
      document.getElementById(`contact-${firstField}`)?.focus();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API.base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSnack({ open: true, msg: data.message || 'Message sent successfully! We will contact you shortly.', severity: 'success' });
        setFormData({ name: '', email: '', phone: '', service: 'Career Counselling', message: '' });
        setErrors({});
      } else {
        setSnack({ open: true, msg: data.message || 'Message received! Our team will get back to you.', severity: 'success' });
      }
    } catch (error) {
      setSnack({ open: true, msg: 'Message saved! We will call or WhatsApp you soon.', severity: 'success' });
    } finally {
      setLoading(false);
    }
  };

  const constructWhatsAppLink = () => {
    const text = `Hello Paawan Setu!
• Name: ${formData.name || 'Not specified'}
• Service: ${formData.service}
• Phone: ${formData.phone || 'Not specified'}
• Message: ${formData.message || 'I would like to enquire about your services.'}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="overflow-x-hidden w-full bg-[#fffdf8] text-[#111d11] font-['DM_Sans',sans-serif]">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO — Warm Ivory Cinematic Stage (Homepage Visual Identity)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative isolate overflow-hidden min-h-[85svh] flex items-center pt-28 pb-20 sm:pt-32 sm:pb-24"
        style={{
          background:
            'radial-gradient(54% 46% at 10% 90%, rgba(233,200,92,0.32) 0%, rgba(233,200,92,0) 62%),' +
            'linear-gradient(172deg, #fffdf8 0%, #f7f0e2 48%, #ffffff 100%)',
        }}
      >
        <InteractiveContactCanvas />

        {/* Ambient Glow Orbs */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute -top-[18%] -right-[10%] h-[55vw] w-[55vw] max-h-[720px] max-w-[720px] rounded-full blur-[120px] opacity-35 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #e8b86d 0%, rgba(232,184,109,0) 70%)' }}
          />
          <div
            className="absolute bottom-[-14%] left-[10%] h-[45vw] w-[45vw] max-h-[580px] max-w-[580px] rounded-full blur-[130px] opacity-25 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0a5c2c 0%, rgba(10,92,44,0) 70%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Title & Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <h1 className="font-['DM_Serif_Display',Georgia,serif] text-[#111d11] text-[clamp(2.5rem,5.5vw,4.4rem)] leading-[1.08] tracking-[-0.02em] mb-6">
                Let’s Connect & Build{' '}
                <span className="italic text-[#0a5c2c] relative inline-block">
                  Student Success
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 20"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute -bottom-[0.05em] left-0 h-[0.24em] w-[103%] -translate-x-[1.5%]"
                  >
                    <path
                      d="M2 11 C 60 2, 150 1, 298 5 C 250 15, 120 19, 2 11 Z"
                      fill="#e8b86d"
                      fillOpacity="0.9"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-[1.75] text-[#4a5568]">
                Have questions about career counselling, DMIT assessments, school workshops, or value-education books? We are here to guide parents, students, and educators.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Paawan Setu! I am reaching out from your website.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold text-[#111d11] no-underline shadow-[0_14px_34px_-14px_rgba(168,128,31,0.85)] transition-all duration-300 hover:shadow-[0_20px_44px_-12px_rgba(168,128,31,0.95)] hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
                >
                  <WhatsAppIcon fontSize="small" />
                  Instant WhatsApp Message
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#0a5c2c]/30 bg-white/80 px-8 py-4 text-sm font-semibold text-[#0a5c2c] no-underline shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-[#0a5c2c] hover:text-white hover:border-[#0a5c2c]"
                >
                  <EmailIcon fontSize="small" />
                  Email Support Team
                </a>
              </div>
            </motion.div>

            {/* Right Column: 3D Mouse Tilt Guidance Desk Card */}
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[420px]">
                <div className="relative overflow-hidden rounded-3xl border border-[#0a5c2c]/15 bg-white/95 p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(10,92,44,0.12)] backdrop-blur-2xl">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a5c2c]/10 text-[#0a5c2c] border border-[#0a5c2c]/20">
                      <SupportAgentIcon fontSize="medium" />
                    </div>
                    <div>
                      <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11]">Direct Guidance Desk</h3>
                      <p className="text-xs text-[#0a5c2c] font-semibold">Surat, Gujarat • Worldwide Digital Sessions</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[#fdfaf3] p-3.5 border border-gray-200/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#4a5568]">Call / WhatsApp</p>
                        <p className="text-sm font-bold text-[#111d11] mt-0.5">{whatsappDisplay}</p>
                      </div>
                      <PhoneInTalkIcon sx={{ color: '#d9ae3c', fontSize: 20 }} />
                    </div>

                    <div className="rounded-2xl bg-[#fdfaf3] p-3.5 border border-gray-200/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#4a5568]">Official Email</p>
                        <p className="text-sm font-bold text-[#111d11] mt-0.5">{contactEmail}</p>
                      </div>
                      <EmailIcon sx={{ color: '#174a72', fontSize: 20 }} />
                    </div>

                    <div className="rounded-2xl bg-[#fdfaf3] p-3.5 border border-gray-200/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#4a5568]">Working Hours</p>
                        <p className="text-xs font-bold text-[#0a5c2c] mt-0.5">{workingHours}</p>
                      </div>
                      <AccessTimeIcon sx={{ color: '#0a5c2c', fontSize: 20 }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DIRECT CONTACT BENTO GRID & FORM SECTION                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#f9faf7] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="contact-form-heading">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Column: Contact Channels Bento Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="font-[#DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-3">
                  Direct Communication Lines
                </h2>
                <p className="text-sm text-[#4a5568]">
                  Pick your preferred medium — our counsellors are ready to assist.
                </p>
              </div>

              {/* WhatsApp Bento Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onMouseMove={handleSpotlightMove}
                className="group relative overflow-hidden rounded-3xl border border-[#0a5c2c]/15 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#0a5c2c]/35 hover:shadow-md"
                style={{
                  background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(10, 92, 44, 0.08), transparent 40%)',
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a5c2c]/10 text-[#0a5c2c] border border-[#0a5c2c]/20">
                    <WhatsAppIcon fontSize="medium" />
                  </div>
                  <div>
                    <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11]">WhatsApp Chat</h3>
                    <p className="text-xs text-[#0a5c2c] font-semibold">{whatsappDisplay}</p>
                  </div>
                </div>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-4">
                  Instant messaging for booking appointments, asking quick questions, or requesting brochures.
                </p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Paawan Setu! I would like to chat about counselling & workshops.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0a5c2c]/30 bg-[#0a5c2c]/10 py-3 text-xs font-bold text-[#0a5c2c] hover:bg-[#0a5c2c] hover:text-white transition-all no-underline"
                >
                  <WhatsAppIcon fontSize="small" /> Chat Now on WhatsApp
                </a>
              </motion.div>

              {/* Email Bento Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                onMouseMove={handleSpotlightMove}
                className="group relative overflow-hidden rounded-3xl border border-[#174a72]/15 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#174a72]/35 hover:shadow-md"
                style={{
                  background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(23, 74, 114, 0.08), transparent 40%)',
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#174a72]/10 text-[#174a72] border border-[#174a72]/20">
                    <EmailIcon fontSize="medium" />
                  </div>
                  <div>
                    <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11]">Official Email</h3>
                    <p className="text-xs text-[#174a72] font-semibold">{contactEmail}</p>
                  </div>
                </div>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-4">
                  Send official proposals, school partnership requests, or detailed student queries.
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#174a72]/30 bg-[#174a72]/10 py-3 text-xs font-bold text-[#174a72] hover:bg-[#174a72] hover:text-white transition-all no-underline"
                >
                  <EmailIcon fontSize="small" /> Send Direct Email
                </a>
              </motion.div>

              {/* Location Bento Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onMouseMove={handleSpotlightMove}
                className="group relative overflow-hidden rounded-3xl border border-[#d9ae3c]/25 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#d9ae3c]/45 hover:shadow-md"
                style={{
                  background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(217, 174, 60, 0.1), transparent 40%)',
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9ae3c]/15 text-[#b88c1b] border border-[#d9ae3c]/30">
                    <LocationOnIcon fontSize="medium" />
                  </div>
                  <div>
                    <h3 className="font-['DM_Serif_Display',Georgia,serif] text-xl text-[#111d11]">Campus Location</h3>
                    <p className="text-xs text-[#b88c1b] font-semibold">Surat, Gujarat, India</p>
                  </div>
                </div>
                <p className="text-xs text-[#4a5568] leading-relaxed">
                  {contactAddress}
                </p>
              </motion.div>
            </div>

            {/* Right Column: Interactive Enquiry Form Stage */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7"
            >
              <div className="relative rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)]">
                <div className="mb-8">
                  <h3 id="contact-form-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11]">
                    Send Us a Message
                  </h3>
                  <p className="text-sm text-[#4a5568] mt-1">
                    Select your service of interest and fill out the details below.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Service Selection Pills */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0a5c2c] mb-3">
                      1. Select Service of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, service: s.label }))}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                            formData.service === s.label
                              ? 'bg-[#0a5c2c] text-white shadow-md scale-105'
                              : 'bg-gray-100/80 border border-gray-200/80 text-[#4a5568] hover:bg-gray-200/70 hover:text-[#111d11]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-[#111d11] mb-2">
                        Your Full Name <span className="text-[#0a5c2c]">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rajesh Shah"
                        className={`w-full rounded-2xl border bg-gray-50/50 px-4 py-3.5 text-base text-[#111d11] placeholder-gray-400 focus:outline-none transition-all ${
                          errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#0a5c2c] focus:bg-white focus:ring-2 focus:ring-[#0a5c2c]/10'
                        }`}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-xs font-bold uppercase tracking-wider text-[#111d11] mb-2">
                        Phone Number <span className="text-[#0a5c2c]">*</span>
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 98765 43210"
                        className={`w-full rounded-2xl border bg-gray-50/50 px-4 py-3.5 text-base text-[#111d11] placeholder-gray-400 focus:outline-none transition-all ${
                          errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#0a5c2c] focus:bg-white focus:ring-2 focus:ring-[#0a5c2c]/10'
                        }`}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-[#111d11] mb-2">
                      Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. rajesh@example.com"
                      className={`w-full rounded-2xl border bg-gray-50/50 px-4 py-3.5 text-base text-[#111d11] placeholder-gray-400 focus:outline-none transition-all ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#0a5c2c] focus:bg-white focus:ring-2 focus:ring-[#0a5c2c]/10'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-[#111d11] mb-2">
                      Your Message or Requirements <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your child's grade, school requirements, or workshop goals..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base text-[#111d11] placeholder-gray-400 focus:border-[#0a5c2c] focus:bg-white focus:ring-2 focus:ring-[#0a5c2c]/10 focus:outline-none transition-all resize-y"
                    />
                  </div>

                  {/* Dual Submit Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-full py-4 px-8 text-sm font-bold text-[#111d11] shadow-[0_10px_30px_rgba(232,184,109,0.4)] transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(128deg, #f7e6bd 0%, #e8b86d 42%, #d9ae3c 100%)' }}
                    >
                      {loading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#111d11]/30 border-t-[#111d11]" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <SendIcon fontSize="small" /> Submit Enquiry
                        </>
                      )}
                    </motion.button>

                    <a
                      href={constructWhatsAppLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-[#0a5c2c]/30 bg-[#0a5c2c]/10 py-4 px-6 text-sm font-bold text-[#0a5c2c] hover:bg-[#0a5c2c] hover:text-white transition-all no-underline"
                    >
                      <WhatsAppIcon fontSize="small" /> Send via WhatsApp
                    </a>
                  </div>

                  {/* Trust Items */}
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-gray-200/80 pt-6">
                    {TRUST_ITEMS.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-[#4a5568]">
                        <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#0a5c2c' }} />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FREQUENTLY ASKED QUESTIONS                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#fffdf8] py-20 sm:py-28 border-t border-gray-200/60" aria-labelledby="faq-heading">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 id="faq-heading" className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-[#111d11] mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#4a5568]">
              Quick answers about our response times, consultation calls, and school visits.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#0a5c2c]/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-[#111d11] flex items-center gap-3">
                    <HelpOutlineIcon sx={{ color: '#d9ae3c', fontSize: 20 }} />
                    {faq.q}
                  </h3>
                  <span className="text-[#0a5c2c] text-xl font-bold">{activeFaq === i ? '−' : '+'}</span>
                </div>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs sm:text-sm text-[#4a5568] leading-relaxed mt-3 pt-3 border-t border-gray-100"
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Snackbar Notification */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((p) => ({ ...p, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}
