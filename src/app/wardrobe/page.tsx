'use client';

import { useState } from 'react';
import Link from 'next/link';

const wardrobeItems = [
  { id: 1, name: 'Floral Pattern', category: 'Patterns', date: '2 days ago' },
  { id: 2, name: 'Leather Texture', category: 'Textures', date: '1 week ago' },
  { id: 3, name: 'Summer Print', category: 'Patterns', date: '2 weeks ago' },
  { id: 4, name: 'Wool Fabric', category: 'Textures', date: '3 weeks ago' },
];

const categories = ['All', 'Patterns', 'Textures', 'Colors', 'Sketches'];

export default function WardrobePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredItems = selectedCategory === 'All' 
    ? wardrobeItems 
    : wardrobeItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      {/* Header */}
      <header className="bg-[#171717] border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-logo text-[#EA931D] text-2xl">MOATT</Link>
          <nav className="flex gap-6">
            <Link href="/templates" className="text-[#CCCCCC] hover:text-white transition-colors">Templates</Link>
            <Link href="/wardrobe" className="text-[#EA931D] font-medium">Wardrobe</Link>
            <Link href="/profile" className="text-[#CCCCCC] hover:text-white transition-colors">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white">Wardrobe</h1>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#EA931D] text-black font-medium py-3 px-6 rounded-xl hover:bg-[#D4850F] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#EA931D] text-black'
                  : 'bg-[#171717] text-[#CCCCCC] hover:text-white border border-[rgba(255,255,255,0.1)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div 
          onClick={() => setIsUploadModalOpen(true)}
          className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl p-12 text-center cursor-pointer hover:border-[#EA931D] hover:bg-[#171717]/50 transition-all mb-8"
        >
          <div className="w-16 h-16 bg-[#EA931D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#EA931D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white font-medium text-lg mb-2">Drop your designs here</p>
          <p className="text-[#4C4B4B]">or click to browse files</p>
          <p className="text-[#4C4B4B] text-sm mt-2">PNG, JPG, SVG up to 10MB</p>
        </div>

        {/* Items Grid */}
        <h2 className="text-xl font-semibold text-white mb-4">Your Assets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#171717] rounded-2xl overflow-hidden hover:ring-2 ring-[#EA931D] transition-all group"
            >
              <div className="aspect-square bg-[#0E0E0E] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#EA931D]/5 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl opacity-50 group-hover:opacity-100 transition-opacity">
                    {item.category === 'Patterns' ? '🎨' : '🧵'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium truncate">{item.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#4C4B4B] text-sm">{item.category}</span>
                  <button className="text-[#EA931D] text-sm hover:underline">Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#CCCCCC] text-lg">No items in this category</p>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Upload Design</h2>
            
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl p-8 text-center mb-6">
              <div className="w-12 h-12 bg-[#EA931D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#EA931D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-[#CCCCCC]">Drag and drop or click to upload</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-[#CCCCCC] block mb-2">Name</label>
                <input 
                  type="text" 
                  placeholder="My Design"
                  className="w-full bg-[#0E0E0E] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white placeholder-[#4C4B4B] focus:outline-none focus:border-[#EA931D]"
                />
              </div>
              <div>
                <label className="text-sm text-[#CCCCCC] block mb-2">Category</label>
                <select className="w-full bg-[#0E0E0E] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#EA931D]">
                  <option>Patterns</option>
                  <option>Textures</option>
                  <option>Colors</option>
                  <option>Sketches</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1) text-white hover:bg-[#0E0E0E] transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 rounded-xl bg-[#EA931D] text-black font-medium hover:bg-[#D4850F] transition-colors">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}