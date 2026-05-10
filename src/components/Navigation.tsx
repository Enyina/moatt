'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/templates', label: 'Templates', icon: '📋' },
  { href: '/wardrobe', label: 'Wardrobe', icon: '👗' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0E0E0E]/90 backdrop-blur-md border-t border-white/10 md:top-0 md:bottom-auto md:left-0 md:right-auto md:w-20 md:h-screen md:border-t-0 md:border-r">
      <div className="flex md:flex-col justify-around md:justify-start md:pt-8 items-center h-16 md:h-auto md:gap-8 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 md:py-4 rounded-lg transition-all ${
                isActive 
                  ? 'text-[#EA931D] scale-110' 
                  : 'text-white/60 hover:text-white hover:scale-105'
              }`}
            >
              <span className="text-xl md:text-2xl">{item.icon}</span>
              <span className="text-[10px] mt-1 md:hidden font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}