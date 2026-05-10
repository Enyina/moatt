'use client';

import { useUserStore, useUIStore } from '@/stores';

/**
 * QuickSettings - Hybrid Flow 5.5
 * Floating widget for quick access to settings
 */
export function QuickSettings() {
  const { user, logout, isAuthenticated } = useUserStore();
  const { 
    quickSettings, 
    toggleQuickSettings, 
    closeQuickSettings,
    openQuickSettings,
    theme,
    setTheme,
  } = useUIStore();

  const handleLogout = () => {
    logout();
    closeQuickSettings();
    window.location.href = '/';
  };

  const handleNavigate = (path: string) => {
    closeQuickSettings();
    window.location.href = path;
  };

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={toggleQuickSettings}
        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
          quickSettings.isOpen 
            ? 'border-[#EA931D] ring-2 ring-[#EA931D]/30' 
            : 'border-white/30 hover:border-[#EA931D]/50'
        }`}
        aria-label="Open quick settings"
      >
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#16213E] flex items-center justify-center">
            <svg 
              className="w-5 h-5 text-[#A0A0B0]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {quickSettings.isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={closeQuickSettings}
          />

          {/* Dropdown Panel */}
          <div className="absolute top-full right-0 mt-2 w-56 bg-[#1A1A2E] rounded-xl shadow-2xl border border-[#EA931D]/30 z-50 overflow-hidden">
            {/* User Info (if authenticated) */}
            {isAuthenticated && user && (
              <div className="p-4 border-b border-white/10">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-[#A0A0B0] text-sm truncate">{user.email}</p>
              </div>
            )}

            {/* Menu Items */}
            <div className="py-2">
              {/* Theme Toggle */}
              <div className="px-4 py-2">
                <p className="text-[#A0A0B0] text-xs uppercase tracking-wider mb-2">Theme</p>
                <div className="flex gap-1 bg-black/30 rounded-lg p-1">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        theme === t
                          ? 'bg-[#EA931D] text-black'
                          : 'text-[#A0A0B0] hover:text-white'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-2" />

              {/* Navigation Links */}
              {isAuthenticated ? (
                <>
                  <MenuItem
                    icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    label="Profile"
                    onClick={() => handleNavigate('/profile')}
                  />
                  <MenuItem
                    icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    label="My Designs"
                    onClick={() => handleNavigate('/profile')}
                  />
                  <MenuItem
                    icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    label="Wardrobe"
                    onClick={() => handleNavigate('/wardrobe')}
                  />

                  <div className="border-t border-white/10 my-2" />

                  <MenuItem
                    icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    label="Settings"
                    onClick={() => handleNavigate('/profile')}
                  />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <MenuItem
                    icon="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    label="Log In"
                    onClick={() => handleNavigate('/auth/login')}
                  />
                  <MenuItem
                    icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    label="Sign Up"
                    onClick={() => handleNavigate('/auth/signup')}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for menu items
function MenuItem({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2.5 flex items-center gap-3 text-white hover:bg-white/5 transition-colors"
    >
      <svg className="w-5 h-5 text-[#A0A0B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <span className="font-medium">{label}</span>
    </button>
  );
}
