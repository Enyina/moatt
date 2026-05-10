'use client';

import Link from 'next/link';
import { useState } from 'react';

const savedDesigns = [
  { id: 1, name: 'Summer Dress', thumbnail: '👗', date: '2 days ago' },
  { id: 2, name: 'Winter Coat', thumbnail: '🧥', date: '1 week ago' },
  { id: 3, name: 'Casual Shirt', thumbnail: '👕', date: '2 weeks ago' },
];

const settingsSections = [
  { id: 'account', name: 'Account', icon: '👤', description: 'Manage your account details' },
  { id: 'appearance', name: 'Appearance', icon: '🎨', description: 'Theme and display settings' },
  { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Email and push notifications' },
  { id: 'privacy', name: 'Privacy', icon: '🔒', description: 'Data and privacy settings' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('designs');

  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      {/* Header */}
      <header className="bg-[#171717] border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-logo text-[#EA931D] text-2xl">MOATT</Link>
          <nav className="flex gap-6">
            <Link href="/templates" className="text-[#CCCCCC] hover:text-white transition-colors">Templates</Link>
            <Link href="/wardrobe" className="text-[#CCCCCC] hover:text-white transition-colors">Wardrobe</Link>
            <Link href="/profile" className="text-[#EA931D] font-medium">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-[#171717] rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#EA931D] flex items-center justify-center text-4xl text-black font-bold">
            JD
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">John Designer</h2>
            <p className="text-[#CCCCCC] mb-2">john@example.com</p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
              <span className="text-[#4C4B4B]">12 Designs</span>
              <span className="text-[#4C4B4B]">•</span>
              <span className="text-[#4C4B4B]">5 Saved</span>
            </div>
          </div>
          <button className="px-6 py-2 rounded-xl border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#0E0E0E] transition-colors">
            Edit Profile
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[rgba(255,255,255,0.1)] pb-4">
          <button
            onClick={() => setActiveTab('designs')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'designs'
                ? 'bg-[#EA931D] text-black'
                : 'text-[#CCCCCC] hover:text-white'
            }`}
          >
            My Designs
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-[#EA931D] text-black'
                : 'text-[#CCCCCC] hover:text-white'
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#EA931D] text-black'
                : 'text-[#CCCCCC] hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'designs' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {savedDesigns.map((design) => (
              <Link
                key={design.id}
                href={`/design/${design.id}`}
                className="bg-[#171717] rounded-2xl overflow-hidden hover:ring-2 ring-[#EA931D] transition-all"
              >
                <div className="aspect-square bg-[#0E0E0E] flex items-center justify-center">
                  <span className="text-6xl">{design.thumbnail}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium">{design.name}</h3>
                  <span className="text-[#4C4B4B] text-sm">{design.date}</span>
                </div>
              </Link>
            ))}
            <button className="bg-[#171717] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-[#1f1f1f] transition-colors border-2 border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#EA931D]">
              <span className="text-4xl">➕</span>
              <span className="text-[#CCCCCC]">New Design</span>
            </button>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {savedDesigns.map((design) => (
              <div
                key={design.id}
                className="bg-[#171717] rounded-2xl overflow-hidden"
              >
                <div className="aspect-square bg-[#0E0E0E] flex items-center justify-center">
                  <span className="text-6xl">{design.thumbnail}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium">{design.name}</h3>
                  <span className="text-[#4C4B4B] text-sm">{design.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                className="w-full bg-[#171717] rounded-xl p-4 flex items-center gap-4 hover:bg-[#1f1f1f] transition-colors text-left"
              >
                <div className="w-12 h-12 bg-[#0E0E0E] rounded-xl flex items-center justify-center text-xl">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-white font-medium">{section.name}</h3>
                  <p className="text-[#4C4B4B] text-sm">{section.description}</p>
                </div>
                <svg className="w-5 h-5 text-[#4C4B4B] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}

            <button className="w-full bg-red-500/10 rounded-xl p-4 flex items-center gap-4 hover:bg-red-500/20 transition-colors text-left mt-8">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-xl">
                🚪
              </div>
              <div>
                <h3 className="text-red-400 font-medium">Sign Out</h3>
                <p className="text-[#4C4B4B] text-sm">Sign out of your account</p>
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}