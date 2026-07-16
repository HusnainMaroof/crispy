"use client";

import { useState } from "react";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search */}
        <div
          className={`flex items-center rounded-lg border border-white/10 bg-white/5 transition-all duration-300 ${
            searchOpen ? "w-48 sm:w-80" : "w-10"
          }`}
        >
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-white/50 transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          {searchOpen && (
            <input
              type="text"
              placeholder="Search menu, orders..."
              className="h-10 w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
              autoFocus
            />
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="relative cursor-pointer rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-red" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-brand-red/30">
            A
          </div>
          <div className="hidden text-sm md:block">
            <p className="font-medium text-white">Admin</p>
            <p className="text-xs text-white/50">crispies.co.uk</p>
          </div>
        </div>
      </div>
    </header>
  );
}
