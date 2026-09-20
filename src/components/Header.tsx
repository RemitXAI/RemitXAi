"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, VolumeX, Sun, Moon, LayoutDashboard, LogIn, User, LogOut, Users, Menu, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletBalance } from './WalletBalance';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function Header({ isDarkMode, onToggleTheme, isVoiceEnabled, onToggleVoice }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-3 py-3 sm:px-6 sm:py-4 rounded-b-2xl',
        isDarkMode 
          ? 'bg-[#0B1220]/80 border-b border-white/5' 
          : 'bg-white/80 border-b border-[#BCC3EE]/30'
      )}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-3 sm:justify-start rounded-lg">
          <Image
            src="/Glow.png"
            alt="RemitX AI Logo"
            width={50}
            height={50}
            unoptimized
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="gradient-text">RemitX</span>
              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}> AI</span>
            </h1>
            <p className={cn(
              'text-xs',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}>
              AI-Powered Cross-Border Payments
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              'p-2 rounded-lg transition-colors sm:hidden',
              isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
            )}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1 sm:flex-none">
            <WalletBalance isDarkMode={isDarkMode} showAddress address="GBC4URMCFRFIDUXH2C4OQ2Z2SPAJGWBVPAVDCXSZF4FNA7WQRLALVGGJ" />
          </div>

          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDarkMode
                    ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                    : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
                )}
                title="Go to Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
              </motion.button>
            </Link>

            <Link href="/recipients">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDarkMode
                    ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                    : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
                )}
                title="View My Recipients"
              >
                <Users className="w-5 h-5" />
              </motion.button>
            </Link>

            <NotificationBell isDarkMode={isDarkMode} />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleVoice}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDarkMode 
                  ? 'hover:bg-white/10 text-slate-400 hover:text-white' 
                  : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
              )}
              title={isVoiceEnabled ? 'Disable voice output' : 'Enable voice output'}
            >
              {isVoiceEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </motion.button>

            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDarkMode
                    ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                    : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
                )}
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={cn(
              'relative w-64 h-full p-4 shadow-2xl',
              isDarkMode ? 'bg-[#0B1220]/95 border-r border-white/5 text-white' : 'bg-white/95 border-r border-[#BCC3EE]/30 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Image src="/Glow.png" alt="logo" width={40} height={40} unoptimized />
                <div>
                  <h2 className="font-bold">RemitX</h2>
                  <p className="text-xs">AI Payments</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-2">
              <Link href="/">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat</span>
                </div>
              </Link>
              <Link href="/dashboard">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </div>
              </Link>
              <Link href="/recipients">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                  <Users className="w-5 h-5" />
                  <span>Recipients</span>
                </div>
              </Link>
            </nav>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center gap-3">
                <button onClick={onToggleVoice} className="p-2 rounded-lg">
                  {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button onClick={onToggleTheme} className="p-2 rounded-lg">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={handleSignOut} className="ml-auto p-2 rounded-lg">
                  {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </motion.header>
  );
}