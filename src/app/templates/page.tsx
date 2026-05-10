'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Template3DPreview } from '@/components/Template3DPreview';
import { getAllBodyTypes } from '@/lib/models';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'children', label: 'Children' },
];

const mockTemplates = getAllBodyTypes().map(config => ({
  id: config.id,
  name: config.name,
  category: config.category,
  bodyTypeId: config.id,
  description: config.description
}));

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/design/new?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      {/* Header */}
      <header className="bg-[#171717] border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-logo text-[#EA931D] text-2xl">MOATT</Link>
          <nav className="flex gap-6">
            <Link href="/templates" className="text-[#EA931D] font-medium">Templates</Link>
            <Link href="/wardrobe" className="text-[#CCCCCC] hover:text-white transition-colors">Wardrobe</Link>
            <Link href="/profile" className="text-[#CCCCCC] hover:text-white transition-colors">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8">Templates</h1>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 pl-12 text-white placeholder-[#4C4B4B] focus:outline-none focus:border-[#EA931D]"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4C4B4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.value
                ? 'bg-[#EA931D] text-black'
                : 'bg-[#171717] text-[#CCCCCC] hover:text-white border border-[rgba(255,255,255,0.1)]'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className="bg-[#171717] rounded-2xl p-4 hover:bg-[#1f1f1f] hover:ring-2 ring-[#EA931D] transition-all text-left group"
            >
              <div className="aspect-square bg-[#0E0E0E] rounded-xl mb-4 overflow-hidden">
                <Template3DPreview
                  category={template.category as 'women' | 'men' | 'children'}
                  bodyTypeId={template.bodyTypeId}
                  className="w-full h-full"
                />
              </div>
              <p className="text-white font-medium">{template.name}</p>
              <p className="text-[#4C4B4B] text-sm capitalize mt-1">{template.description}</p>
            </button>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#CCCCCC] text-lg">No templates found</p>
            <p className="text-[#4C4B4B]">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}