'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useUserStore, useDesignStore } from '@/stores';
import { QuickSettings } from '@/components/QuickSettings';

// ============================================
// USER FLOW DETECTION INTEGRATION
// ============================================
function HomePageWithFlow() {
  const { userStatus, isAuthenticated, user } = useUserStore();
  const { recentDesigns: userDesigns, loadRecentDesigns } = useDesignStore();

  // Load designs for returning users
  useEffect(() => {
    if (userStatus.type === 'returning' || userStatus.hasSavedDesigns) {
      loadRecentDesigns();
    }
  }, [userStatus, loadRecentDesigns]);

  // FLOW 0.5: Returning User - Show streamlined dashboard
  if (userStatus.type === 'returning' || userStatus.hasSavedDesigns) {
    return <ReturningUserDashboard
      recentDesigns={userDesigns.length > 0 ? userDesigns : recentDesigns}
      isAuthenticated={isAuthenticated}
      user={user}
    />;
  }

  // FLOW 0: New User - Show full landing experience (original design below)
  return <NewUserLanding />;
}

interface Design {
  id: number;
  name: string;
  date: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface HowItWorksItem {
  step: number;
  title: string;
  desc: string;
}

const recentDesigns = [
  { id: '1', name: 'Summer Collection', thumbnail: null, updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', name: 'Winter Coat v2', thumbnail: null, updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', name: 'Evening Dress', thumbnail: null, updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '4', name: 'Casual Tee Design', thumbnail: null, updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const templates: Template[] = [
  { id: '1', name: 'Women Standard', category: 'Women' },
  { id: '2', name: 'Men Athletic', category: 'Men' },
  { id: '3', name: 'Child Basic', category: 'Children' },
];

const features: Feature[] = [
  { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', title: '3D Mannequins', desc: 'Choose from men, women, and children templates' },
  { icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', title: 'Design Tools', desc: 'Draw, paint, and apply textures' },
  { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', title: 'Export Options', desc: 'High-res images or print-ready PDFs' },
  { icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', title: 'Share & Collaborate', desc: 'Share designs and get feedback' },
];

const howItWorks: HowItWorksItem[] = [
  { step: 1, title: 'Choose Template', desc: 'Select from our library of mannequins' },
  { step: 2, title: 'Design', desc: 'Use our tools to create your vision' },
  { step: 3, title: 'Export', desc: 'Download and share your creation' },
];

function HeroSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black">
      {/* Background Images - layered */}
      <div className="absolute inset-0">
        <img
          src="/data/image.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <img
          src="/data/image_fx_ (4) Background Removed 1.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      <header className="absolute top-0 left-0 right-0 flex justify-between items-center px-8 py-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#EA931D] rounded-full" />
          <div className="w-4 h-4 bg-[#EA931D] rounded-full -ml-1" />
          <h1 className="text-3xl md:text-5xl font-bold text-white ml-4" style={{ fontFamily: 'var(--font-pacifico)' }}>
            Moatt
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="px-6 py-2 text-white font-bold hover:text-[#EA931D] transition-colors">
            Log In
          </Link>
          <Link href="/templates" className="px-6 py-3 bg-[#EA931D] text-white font-bold rounded-full hover:bg-[#D4850F] transition-colors">
            Start Designing
          </Link>
        </div>
      </header>

      <div className="relative h-full flex flex-col items-center justify-center px-8">
        <h1 className="text-5xl md:text-8xl font-black text-center uppercase tracking-tight mb-6">
          <span className="text-white">Sty</span><span className="text-white">le</span><span className="text-white/30">vol</span><span className="text-white">ution</span>
        </h1>

        <p className="text-lg md:text-2xl text-white text-center max-w-2xl mb-12 font-light">
          From sketch to digital masterpiece—<span className="text-[#EA931D] font-bold">our 3D</span> software turns your ideas into wearable art.
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center animate-bounce">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function QuickStartSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black">
      {/* Background Image - on left side */}
      <div className="absolute inset-0">
        <img
          src="/data/image_fx_ (10) Background Removed 1.svg"
          alt=""
          className="absolute left-0 top-0 h-full w-1/2 object-contain opacity-90"
        />
      </div>

      {/* Content on right side - matching 2.png */}
      <div className="relative h-full flex flex-col justify-center px-16 ml-auto max-w-xl">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight">
          Start Creating
        </h2>
        <p className="text-[#CCCCCC] text-xl mb-10">Choose a template or start from scratch</p>

        {/* Cards matching the right side of 2.png */}
        <div className="space-y-3">
          {/* Card 1 */}
          <div className="bg-[#1A1A1A] border-2 border-[#EA931D] rounded-2xl p-5 hover:shadow-[0_0_20px_rgba(234,147,29,0.3)] transition-all">
            <h3 className="text-white font-black text-xl mb-2">Women Standard</h3>
            <p className="text-[#B8B8B8] text-sm mb-3">Perfect for everyday fashion designs with standard proportions</p>
            <div className="flex items-center gap-2">
              <span className="bg-[#EA931D] text-black px-3 py-1 rounded-full text-xs font-bold">Popular</span>
              <span className="text-[#666666] text-xs">Classic fit</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1A1A1A] border-2 border-[#EA931D] rounded-2xl p-5 hover:shadow-[0_0_20px_rgba(234,147,29,0.3)] transition-all">
            <h3 className="text-white font-black text-xl mb-2">Men Athletic</h3>
            <p className="text-[#B8B8B8] text-sm mb-3">Ideal for sportswear and active wear with muscular build</p>
            <div className="flex items-center gap-2">
              <span className="bg-[#EA931D] text-black px-3 py-1 rounded-full text-xs font-bold">New</span>
              <span className="text-[#666666] text-xs">Athletic fit</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1A1A1A] border-2 border-[#EA931D] rounded-2xl p-5 hover:shadow-[0_0_20px_rgba(234,147,29,0.3)] transition-all">
            <h3 className="text-white font-black text-xl mb-2">Child Basic</h3>
            <p className="text-[#B8B8B8] text-sm mb-3">Designed for children's clothing with age-appropriate sizing</p>
            <div className="flex items-center gap-2">
              <span className="bg-[#EA931D] text-black px-3 py-1 rounded-full text-xs font-bold">Kids</span>
              <span className="text-[#666666] text-xs">Youth sizes</span>
            </div>
          </div>
        </div>

        {/* Start Designing Button */}
        <div className="mt-6">
          <Link
            href="/templates"
            className="inline-flex items-center gap-3 bg-[#EA931D] text-black font-black py-4 px-8 rounded-full hover:bg-[#D4850F] transition-all hover:scale-105"
          >
            Start Designing
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ChooseMoattSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black">
      {/* Background Image - on left side */}
      <div className="absolute inset-0">
        <img
          src="/data/image_fx_ (10) Background Removed 1.svg"
          alt=""
          className="absolute left-0 top-0 h-full w-1/3 object-contain opacity-90"
        />
      </div>

      {/* Content on right side */}
      <div className="relative h-full flex flex-col justify-center px-16 ml-auto max-w-2xl">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 uppercase tracking-tight leading-none">
          CHOOSE <span className="text-[#EA931D]">MOATT</span>
        </h1>

        {/* Sub-headline */}
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 uppercase tracking-tight leading-tight">
          BOOST CREATIVITY <br /> AND EFFICIENCY
        </h2>

        {/* Body Text */}
        <p className="text-gray-300 text-base leading-relaxed mb-12 max-w-lg">
          Digital design space that saves time and reduces waste.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-5">
          {/* Card 1 - Sustainable Design */}
          <div className="bg-transparent border border-gray-600 rounded-2xl p-5 hover:border-gray-400 transition-all h-full">
            <h3 className="text-white font-bold text-base mb-2">Sustainable Design</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Experiment without waste. Reduce the need for multiple physical prototypes, contributing to a more eco-friendly design process.</p>
          </div>

          {/* Card 2 - Real-Time Collaboration */}
          <div className="bg-transparent border border-gray-600 rounded-2xl p-5 hover:border-gray-400 transition-all h-full">
            <h3 className="text-white font-bold text-base mb-2">Real-Time Collaboration</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Get instant feedback from clients, colleagues, or manufacturers without waiting for samples to ship.</p>
          </div>

          {/* Card 3 - Simplified Workflow */}
          <div className="bg-transparent border border-gray-600 rounded-2xl p-5 hover:border-gray-400 transition-all h-full">
            <h3 className="text-white font-bold text-base mb-2">Simplified Workflow</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Intuitive tools allow you to focus on your designs while we handle the tech side. Create, edit, and render effortlessly in one place.</p>
          </div>

          {/* Empty space for grid alignment */}
          <div className="invisible"></div>
        </div>
      </div>
    </section>
  );
}


function FeaturesSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-white">
      {/* Background grid - subtle spanning behind subject */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#999 1px, transparent 1px), linear-gradient(90deg, #999 1px, transparent 1px)', backgroundSize: '50px 50px' }}
      />
      <div className="relative h-full flex items-center z-10">
        {/* Left: Typography */}
        <div className="w-[30%] pl-20 flex flex-col justify-center">
          <h2 className="text-5xl font-bold mb-3">
            <span className="text-black">KEY </span>
            <span className="text-[#EA931D]">FEATURES</span>
          </h2>
          <h3 className="text-3xl font-black text-black mb-8 leading-tight">
            DESIGN FASTER,<br />SMARTER,<br />AND BETTER
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            Empowering fashion designers with cutting-edge 3D modeling, texture visualization, and real-time rendering capabilities. Transform your creative workflow with professional-grade tools that bring your vision to life with unprecedented precision and speed.
          </p>
        </div>

        {/* Center: Mannequin */}
        <div className="w-[35%] h-full flex items-center justify-center p-8">
          <img
            src="/data/Group 748.svg"
            alt="Mannequin"
            className="h-full w-auto object-contain scale-110"
            style={{ filter: 'contrast(1.2)' }}
          />
        </div>

        {/* Right: Feature Callouts - aligned with mannequin */}
        <div className="w-[35%] pr-12 space-y-16">
          {/* Callout 1 - Realistic 3D Rendering (shoulder area) */}
          <div className="flex items-start gap-4 relative">
            {/* SVG L-shaped pointer line */}
            <svg className="absolute left-0 top-0 w-40 h-20" style={{ left: '-120px', top: '-40px' }}>
              <path
                d="M 40 40 L 40 20 L 120 20"
                stroke="#A0A0A0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
            {/* Anchor point on mannequin shoulder */}
            <div className="absolute left-0 top-0" style={{ left: '-118px', top: '-38px', zIndex: 10 }}>
              <div className="w-3 h-3 bg-[#EA931D] rounded-full"></div>
            </div>
            <div className="items-start">
              <h4 className="text-black font-bold text-lg">Realistic 3D Rendering</h4>
              <p className="text-gray-600 text-sm">See your designs come to life with true-to-detail fabric and texture simulations.</p>
            </div>
          </div>
          {/* Callout 2 - Collaboration Ready (waist area) */}
          <div className="flex items-start gap-4 relative">
            {/* SVG L-shaped pointer line */}
            <svg className="absolute left-0 top-0 w-40 h-20" style={{ left: '-120px', top: '-40px' }}>
              <path
                d="M 40 40 L 35 25 L 120 25"
                stroke="#A0A0A0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
            {/* Anchor point on mannequin waist */}
            <div className="absolute left-0 top-0" style={{ left: '-118px', top: '-38px', zIndex: 10 }}>
              <div className="w-3 h-3 bg-[#EA931D] rounded-full"></div>
            </div>
            <div className="items-start">
              <h4 className="text-black font-bold text-lg">Collaboration Ready</h4>
              <p className="text-gray-600 text-sm">Work seamlessly with your team, share designs, and gather feedback all in one place.</p>
            </div>
          </div>
          {/* Callout 3 - Instant Fit Testing (knee area) */}
          <div className="flex items-start gap-4 relative">
            {/* SVG L-shaped pointer line */}
            <svg className="absolute left-0 top-0 w-40 h-20" style={{ left: '-120px', top: '-40px' }}>
              <path
                d="M 40 40 L 30 30 L 120 30"
                stroke="#A0A0A0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
            {/* Anchor point on mannequin knee */}
            <div className="absolute left-0 top-0" style={{ left: '-118px', top: '-38px', zIndex: 10 }}>
              <div className="w-3 h-3 bg-[#EA931D] rounded-full"></div>
            </div>
            <div className="items-start">
              <h4 className="text-black font-bold text-lg">Instant Fit Testing</h4>
              <p className="text-gray-600 text-sm">Preview how your designs will look and feel in motion with instant, on-the-fly adjustments.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InteractiveCanvasSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black relative">
      {/* Background using Mask group.svg */}
      <div className="absolute inset-0">
        <img
          src="/data/Mask group.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      </div>

      {/* Main content container */}
      <div className="relative h-full flex items-center justify-center px-8">
        {/* Left Toolbar */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
          <div className="bg-black/80 backdrop-blur-md rounded-full p-3 shadow-2xl border border-white/10">
            <div className="flex flex-col gap-4">
              {/* Pen/Brush tool */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              {/* Selection/Transformation tool */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              {/* Path/Anchor point tool */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>

              {/* Fill/Shape tool */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11h-8l3.29-3.29a1 1 0 00-1.42-1.42l-5 5a1 1 0 000 1.42l5 5a1 1 0 001.42 0 1 1 0 000-1.42L11 13h8a1 1 0 000-2z" />
                  <path d="M5 19h14v2H5z" opacity="0.3" />
                </svg>
              </button>

              {/* Eraser tool */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Layers tool */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Central Video Container */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* YouTube Video Embed */}
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/sBtHqsIDv70?autoplay=0&controls=1&modestbranding=1&rel=0"
              title="3D Fashion Design Tutorial - CLO 3D"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* UI overlay elements */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-xs font-medium">3D Fashion Design</p>
            </div>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-xs font-medium">Professional Tutorial</p>
            </div>
          </div>
        </div>

        {/* Right Toolbar */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
          <div className="bg-black/80 backdrop-blur-md rounded-full p-3 shadow-2xl border border-white/10">
            <div className="flex flex-col gap-4 items-center">
              {/* Zoom controls */}
              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>

              <button className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F58220] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>

              {/* Color gradient slider */}
              <div className="relative h-32 w-6">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(to bottom, #FFFFFF, #F58220, #FFD700, #00FF00, #0000FF, #800080, #FF0000)'
                  }}
                />
                {/* Color selector ring */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-white rounded-full shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </section>
  );
}

function CTASection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black relative">
      {/* Background gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content positioned at center bottom */}
      <div className="absolute bottom-0 left-0 right-0 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-wider leading-tight mb-4">
            <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent drop-shadow-2xl">
              BRINGING FASHION CONCEPTS
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#EA931D] via-[#F58220] to-[#EA931D] bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
              TO LIFE WITH MOATT 3D TOOLS
            </span>
          </h2>

          {/* Subtle underline accent */}
          <div className="mt-6 flex justify-center">
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#EA931D] to-transparent rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-[#171717]">
      <div className="h-full flex flex-col items-center justify-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center">How It Works</h2>

        <div className="flex flex-col md:flex-row gap-12 md:gap-24 max-w-6xl">
          {howItWorks.map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center group">
              {/* Circular icon with hover effect */}
              <div className="w-20 h-20 bg-[#EA931D] rounded-full flex items-center justify-center text-black font-bold text-3xl mb-6 shadow-lg group-hover:shadow-[0_0_30px_rgba(234,147,29,0.5)] transition-all duration-300 group-hover:scale-105">
                {item.step}
              </div>

              {/* Title with gradient text */}
              <h3 className="text-white font-bold text-2xl mb-3 group-hover:text-[#EA931D] transition-colors duration-300">
                {item.title}
              </h3>

              {/* Description with better spacing */}
              <p className="text-[#CCCCCC] text-sm leading-relaxed max-w-[220px] group-hover:text-white transition-colors duration-300">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomisableHeroSection() {
  return (
    <section className="relative w-full min-h-[600px] md:min-h-[800px] bg-white overflow-hidden">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left Side - Visual Assets */}
        <div className="relative w-full md:w-1/2 bg-[#1A1A1A] min-h-[600px] md:min-h-[800px]">
          <img
            src="/data/Photo Componet.svg"
            alt="Two female mannequins wearing draped wrap dresses"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
          />
          {/* Cinematic lighting overlay */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/30" />
        </div>

        {/* Right Side - Typography & Content */}
        <div className="relative w-full md:w-1/2 bg-white min-h-[600px] md:min-h-[800px] flex items-center px-6 md:px-8 lg:px-12">
          <div className="w-full max-w-lg ml-0 md:ml-[10%]">
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-none mb-6">
              <span className="text-black uppercase">CUSTOMIS</span>
              <span className="text-[#F2994A] uppercase">ABLE</span>
            </h1>

            {/* Sub-headline */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-black uppercase leading-tight mb-6">
              DESIGN FOR<br />
              EVERY BODY,<br />
              EVERY STYLE
            </h2>

            {/* Body Copy */}
            <p className="text-[#4F4F4F] text-base md:text-lg leading-relaxed mb-8 font-medium">
              In fashion, details matter. Our mannequins can be customised with a variety of skin tones, body types, and poses to perfectly match your design vision. Create truly inclusive fashion that celebrates diversity.
            </p>

            {/* Interactive CTA */}
            <div className="flex items-center justify-start">
              <button className="group flex items-center gap-3 bg-white border-2 border-black rounded-full px-6 py-3 hover:bg-black hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl">
                <span className="font-semibold text-black group-hover:text-white">Explore Some More</span>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md group-hover:bg-[#F2994A] transition-colors duration-300">
                  <svg
                    className="w-4 h-4 text-[#F2994A] group-hover:text-white transition-colors duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .flex-col {
            flex-direction: column;
          }
          .ml-0 {
            margin-left: 0;
          }
        }
      `}</style>
    </section>
  );
}

function FooterSection() {
  return (
    <section className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-[#1A1A1A] relative">
      {/* Grid overlay - CAD/blueprint style */}
      {/* <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0.5px, transparent 0.5px)',
          backgroundSize: '50px 50px'
        }}
      /> */}

      <LandingHeroSection />
      <ContactSection />


    </section >
  );
}

function LandingHeroSection() {
  return (
    <section className="relative min-h-[300px] md:min-h-[350px] lg:h-[35vh] w-full overflow-hidden bg-[#1A1A1A] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6">

      {/* Atmospheric Background Layer */}
      <div className="absolute inset-0">
        <img
          src="/data/image (1).svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0.6,
            filter: 'grayscale(80%) brightness(40%) contrast(120%)'
          }}
        />
      </div>

      {/* Dark Fade Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

      {/* Content - positioned in upper two-thirds */}
      <div className="relative z-10 flex  items-center justify-center" style={{ height: '66.67%' }}>
        {/* Hero Typography - Extra-Bold Sans-Serif */}
        <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-white text-center uppercase leading-none mb-0" style={{ fontFamily: 'Inter, Montserrat, sans-serif' }}>
          <span className=" mb-1">UNLOCK YOUR </span>
          <span className=" text-[#F2994A]  items-center justify-center gap-2 mb-1">
            CREATIVITY
            {/* Orange Hand-Cursor Icon */}
            {/* <svg className="w-3 h-3 text-[#F2994A]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg> */}
          </span>
          <span className=" mb-1"> AND </span>
          <span className=" block mb-1">STREAMLINE YOUR DESIGN PROCESS</span>
          <span className="block">WITH OUR 3D FASHION ILLUSTRATION SOFTWARE</span>
        </h1>
      </div>

      {/* Login/Action Pill - anchored in lower third */}
      <div className="relative z-10 flex items-center justify-center" style={{ height: '33.33%' }}>
        <div className="inline-flex items-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-3 py-3 gap-3">
          {/* Left Side - Log In */}
          <button className="px-4 sm:px-6 py-2 text-white font-medium hover:text-[#F2994A] transition-colors text-xs sm:text-sm">
            Log In
          </button>

          {/* Right Side - Start Designing */}
          <button className="px-4 sm:px-6 py-2 bg-[#F2994A] text-white font-bold rounded-full hover:bg-[#E0883A] transition-colors text-xs sm:text-sm whitespace-nowrap">
            Start Designing
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="relative min-h-[500px] md:min-h-[550px] lg:h-[65vh] w-full overflow-hidden bg-black flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl w-full">
        {/* Massive Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white text-center uppercase mb-4 sm:mb-6" style={{ fontWeight: 900, letterSpacing: '-0.05em' }}>
          CONTACT US
        </h1>

        {/* Sub-text */}
        <p className="text-sm sm:text-base md:text-lg text-[#D1D1D1] text-center mb-8 sm:mb-12">
          Get the latest <span className="text-[#F2994A] font-bold">hyper</span> update here.
        </p>

        {/* Newsletter/Email Input */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 items-center justify-center mb-6 sm:mb-8 w-full max-w-[320px] sm:max-w-[400px] mx-auto px-4 sm:px-0">
          <input
            type="email"
            placeholder="Email address here.."
            className="flex-1 w-full sm:w-auto h-10 px-4 bg-[#E0E0E0] text-[#1A1A1A] rounded-full focus:outline-none focus:ring-2 focus:ring-[#F2994A] transition-colors placeholder-[#666666] border-none text-sm"
          />
          <button className="h-10 px-6 bg-[#F2994A] text-white font-bold rounded-full hover:bg-[#E0883A] transition-colors whitespace-nowrap text-sm w-full sm:w-auto">
            Send Now
          </button>
        </div>

        {/* Social Media Icons */}
        <div className="flex gap-4 sm:gap-3 items-center justify-center">
          {/* Instagram */}
          <a href="#" className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center text-[#808080] hover:text-white transition-colors">
            <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
            </svg>
          </a>

          {/* Facebook */}
          <a href="#" className="w-6 h-6 flex items-center justify-center text-[#808080] hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a href="#" className="w-6 h-6 flex items-center justify-center text-[#808080] hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>

          {/* X (Twitter) - Modern X logo */}
          <a href="#" className="w-6 h-6 flex items-center justify-center text-[#808080] hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FLOW 0: NEW USER LANDING (Original Design)
// ============================================
function NewUserLanding() {
  return (
    <div className="relative">
      <HeroSection />
      <ChooseMoattSection />
      <FeaturesSection />
      <InteractiveCanvasSection />
      <CTASection />
      <CustomisableHeroSection />
      <FooterSection />
    </div>
  );
}

// ============================================
// FLOW 0.5: RETURNING USER DASHBOARD
// ============================================
function ReturningUserDashboard({
  recentDesigns,
  isAuthenticated,
  user
}: {
  recentDesigns: { id: string; name: string; thumbnail: string | null; updatedAt?: string }[];
  isAuthenticated: boolean;
  user: { name: string } | null;
}) {
  const hasDesigns = recentDesigns.length > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Header with QuickSettings */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-6 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#EA931D] rounded-full" />
          <div className="w-4 h-4 bg-[#EA931D] rounded-full -ml-1" />
          <h1 className="text-3xl font-bold text-white ml-4" style={{ fontFamily: 'var(--font-pacifico)' }}>
            Moatt
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/templates" className="text-white font-bold hover:text-[#EA931D] transition-colors">
            Templates
          </Link>
          <Link href="/wardrobe" className="text-white font-bold hover:text-[#EA931D] transition-colors">
            Wardrobe
          </Link>
          <QuickSettings />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 px-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {isAuthenticated ? `Welcome back, ${user?.name || 'Designer'}` : 'Welcome back'}
          </h1>
          <p className="text-[#A0A0B0]">Continue where you left off or start something new</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <QuickActionCard
            title="New Design"
            description="Start from scratch"
            icon="M12 4v16m8-8H4"
            href="/templates"
            primary
          />
          <QuickActionCard
            title="Browse Templates"
            description="Explore mannequins"
            icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            href="/templates"
          />
          <QuickActionCard
            title="Wardrobe"
            description="Your uploads"
            icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            href="/wardrobe"
          />
          <QuickActionCard
            title="Profile"
            description="Your designs"
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            href="/profile"
          />
        </div>

        {/* Recent Designs */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Designs</h2>
            <Link href="/profile" className="text-[#EA931D] hover:underline text-sm">
              View all
            </Link>
          </div>

          {hasDesigns ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentDesigns.slice(0, 6).map((design) => (
                <DesignCard key={design.id} design={design} />
              ))}
            </div>
          ) : (
            <div className="bg-[#1A1A2E] rounded-2xl p-12 text-center">
              <svg className="w-16 h-16 text-[#A0A0B0] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[#A0A0B0] mb-4">No designs yet</p>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 text-[#EA931D] font-bold hover:underline"
              >
                Create your first design
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </section>

        {/* Continue Designing */}
        {hasDesigns && (
          <section className="bg-gradient-to-r from-[#EA931D]/20 to-transparent rounded-2xl p-6 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Continue Designing</h3>
                <p className="text-[#A0A0B0] text-sm">
                  Jump back to &quot;{recentDesigns[0].name}&quot;
                </p>
              </div>
              <Link
                href={`/design/${recentDesigns[0].id}`}
                className="px-6 py-3 bg-[#EA931D] text-black font-bold rounded-full hover:bg-[#D4850F] transition-colors"
              >
                Resume
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Helper Components for Returning User Dashboard
function QuickActionCard({
  title,
  description,
  icon,
  href,
  primary = false
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block p-5 rounded-xl border-2 transition-all ${primary
        ? 'bg-[#EA931D] border-[#EA931D] text-black hover:bg-[#D4850F]'
        : 'bg-[#1A1A2E] border-white/10 text-white hover:border-[#EA931D]/50'
        }`}
    >
      <svg className={`w-6 h-6 mb-3 ${primary ? 'text-black' : 'text-[#EA931D]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <h3 className={`font-bold mb-1 ${primary ? 'text-black' : 'text-white'}`}>{title}</h3>
      <p className={`text-sm ${primary ? 'text-black/70' : 'text-[#A0A0B0]'}`}>{description}</p>
    </Link>
  );
}

function DesignCard({ design }: { design: { id: string; name: string; thumbnail: string | null; updatedAt?: string } }) {
  return (
    <Link href={`/design/${design.id}`} className="group">
      <div className="aspect-square bg-[#1A1A2E] rounded-xl overflow-hidden border border-white/10 hover:border-[#EA931D]/50 transition-all">
        {design.thumbnail ? (
          <img
            src={design.thumbnail}
            alt={design.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-[#A0A0B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-white text-sm font-medium mt-2 truncate group-hover:text-[#EA931D] transition-colors">
        {design.name}
      </p>
      <p className="text-[#666] text-xs">
        {design.updatedAt ? new Date(design.updatedAt).toLocaleDateString() : 'Recently'}
      </p>
    </Link>
  );
}

// ============================================
// DEFAULT EXPORT - FLOW ROUTER
// ============================================
export default HomePageWithFlow;