'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUserStore, useDesignStore } from '@/stores';
import { QuickSettings } from './QuickSettings';

/**
 * ConditionalLanding - Switches between Flow 0 (new user) and Flow 0.5 (returning user)
 */
export function ConditionalLanding() {
  const { userStatus, isAuthenticated, user } = useUserStore();
  const { recentDesigns, loadRecentDesigns } = useDesignStore();

  // Load recent designs on mount for returning users
  useEffect(() => {
    if (userStatus.type === 'returning' || userStatus.hasSavedDesigns) {
      loadRecentDesigns();
    }
  }, [userStatus, loadRecentDesigns]);

  // Flow 0: New User Landing
  if (userStatus.type === 'new' && !userStatus.hasSavedDesigns) {
    return <NewUserLanding />;
  }

  // Flow 0.5: Returning User Landing
  return <ReturningUserLanding recentDesigns={recentDesigns} isAuthenticated={isAuthenticated} user={user} />;
}

/**
 * Flow 0: New User Landing
 * Shows hero, onboarding value prop, and template cards
 */
function NewUserLanding() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-6">
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-8 pt-20">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#1A1A2E]" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-center uppercase tracking-tight mb-6">
            <span className="text-white">Style</span>
            <span className="text-[#EA931D]">volution</span>
          </h1>

          <p className="text-lg md:text-2xl text-[#A0A0B0] text-center max-w-2xl mb-12 font-light">
            From sketch to digital masterpiece—<span className="text-[#EA931D] font-bold">our 3D</span> software turns your ideas into wearable art.
          </p>

          {/* CTA */}
          <Link
            href="/templates"
            className="inline-flex items-center gap-3 bg-[#EA931D] text-black font-black py-4 px-8 rounded-full hover:bg-[#D4850F] transition-all hover:scale-105 text-lg"
          >
            Design My Mannequin
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Value Prop Cards */}
        <div className="relative z-10 mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
          <ValueCard
            step={1}
            title="Choose Template"
            description="Select from our library of men, women, and children mannequins"
          />
          <ValueCard
            step={2}
            title="Design & Create"
            description="Use intuitive tools to paint, apply textures, and bring your vision to life"
          />
          <ValueCard
            step={3}
            title="Export & Share"
            description="Download high-quality images or PDFs for your portfolio"
          />
        </div>
      </section>

      {/* Template Preview Section */}
      <section className="py-24 px-8 bg-[#1A1A2E]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Start Creating
          </h2>
          <p className="text-[#A0A0B0] text-center mb-12">Choose a template to begin your design journey</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TemplateCard
              name="Women Standard"
              description="Perfect for everyday fashion designs with standard proportions"
              tag="Popular"
              tagColor="bg-[#EA931D]"
              href="/templates?category=women"
            />
            <TemplateCard
              name="Men Athletic"
              description="Ideal for sportswear and active wear with muscular build"
              tag="New"
              tagColor="bg-green-500"
              href="/templates?category=men"
            />
            <TemplateCard
              name="Child Basic"
              description="Designed for children's clothing with age-appropriate sizing"
              tag="Kids"
              tagColor="bg-blue-500"
              href="/templates?category=children"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Flow 0.5: Returning User Landing
 * Shows recent designs, quick resume, and shortcuts
 */
function ReturningUserLanding({ 
  recentDesigns, 
  isAuthenticated, 
  user 
}: { 
  recentDesigns: { id: string; name: string; thumbnail: string | null; updatedAt: string }[];
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

        {/* Continue Designing (if has designs) */}
        {hasDesigns && (
          <section className="bg-gradient-to-r from-[#EA931D]/20 to-transparent rounded-2xl p-6 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Continue Designing</h3>
                <p className="text-[#A0A0B0] text-sm">
                  Jump back to "{recentDesigns[0].name}"
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

// Helper Components

function ValueCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="bg-[#1A1A2E]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="w-10 h-10 bg-[#EA931D] rounded-full flex items-center justify-center text-black font-bold text-lg mb-4">
        {step}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-[#A0A0B0] text-sm">{description}</p>
    </div>
  );
}

function TemplateCard({ 
  name, 
  description, 
  tag, 
  tagColor,
  href 
}: { 
  name: string; 
  description: string; 
  tag: string;
  tagColor: string;
  href: string;
}) {
  return (
    <Link href={href} className="block bg-[#1A1A1A] border-2 border-[#EA931D] rounded-2xl p-5 hover:shadow-[0_0_20px_rgba(234,147,29,0.3)] transition-all group">
      <h3 className="text-white font-black text-xl mb-2 group-hover:text-[#EA931D] transition-colors">{name}</h3>
      <p className="text-[#B8B8B8] text-sm mb-3">{description}</p>
      <div className="flex items-center gap-2">
        <span className={`${tagColor} text-black px-3 py-1 rounded-full text-xs font-bold`}>{tag}</span>
      </div>
    </Link>
  );
}

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
      className={`block p-5 rounded-xl border-2 transition-all ${
        primary
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

function DesignCard({ design }: { design: { id: string; name: string; thumbnail: string | null; updatedAt: string } }) {
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
        {new Date(design.updatedAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
