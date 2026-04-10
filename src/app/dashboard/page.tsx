'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import type { Transaction, ExchangeRate } from '@/types';

const EXCHANGE_RATES: ExchangeRate[] = [
  { from: 'USD', to: 'NGN', rate: 1400, symbol: '₦' },
  { from: 'EUR', to: 'NGN', rate: 1520, symbol: '₦' },
  { from: 'GBP', to: 'NGN', rate: 1780, symbol: '₦' },
  { from: 'XLM', to: 'NGN', rate: 400, symbol: '₦' },
  { from: 'USD', to: 'XLM', rate: 0.0035, symbol: 'XLM' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', name: 'Sarah', amount: 50, currency: '$', status: 'received', type: 'received', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', name: 'John', amount: 25, currency: '$', status: 'sent', type: 'sent', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '3', name: 'Divine', amount: 100, currency: '$', status: 'sent', type: 'sent', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: '4', name: 'David', amount: 75, currency: '$', status: 'received', type: 'received', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: '5', name: 'Exchange', amount: 50, currency: '$', status: 'received', type: 'received', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
];

export default function Dashboard() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [balance, setBalance] = useState(250);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('remitx-dark-mode');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }

    const savedBalance = localStorage.getItem('remitx-balance');
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }

    const savedTransactions = localStorage.getItem('remitx-transactions');
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        setTransactions(parsed.map((t: Transaction) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        })));
      } catch {
        setTransactions(MOCK_TRANSACTIONS);
      }
    } else {
      setTransactions(MOCK_TRANSACTIONS);
    }
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`
        min-h-screen transition-colors duration-300
        ${isDarkMode 
          ? 'bg-[#0B1220]' 
          : 'bg-slate-50'
        }
      `}>
        <div className={`
          fixed inset-0 pointer-events-none
          ${isDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5160CD]/20 via-[#0B1220] to-[#0B1220]' 
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#BCC3EE] via-slate-50 to-slate-50'
          }
        `} />

        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          isVoiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoice}
        />

        <div className="fixed top-20 left-6 z-30">
          <Link href="/">
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                isDarkMode
                  ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  : 'bg-slate-100 text-slate-600 hover:text-[#234A80] hover:bg-[#BCC3EE]/20'
              )}
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Chat
            </motion.div>
          </Link>
        </div>

        <main className="relative z-10 pt-28 pb-6 px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className={cn(
              'text-3xl font-bold',
              isDarkMode ? 'text-white' : 'text-slate-900'
            )}>
              Dashboard
            </h1>
            <p className={cn(
              'mt-1',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}>
              Your financial overview at a glance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'col-span-1 md:col-span-2 p-6 rounded-2xl border backdrop-blur-xl',
                isDarkMode
                  ? 'bg-gradient-to-br from-[#234A80]/30 to-[#9B7EE9]/20 border-white/10'
                  : 'bg-gradient-to-br from-[#234A80]/10 to-[#9B7EE9]/10 border-[#BCC3EE]/30'
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={cn(
                    'text-sm',
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  )}>
                    Total Balance
                  </p>
                  <h2 className={cn(
                    'text-3xl font-bold',
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  )}>
                    ${balance.toFixed(2)}
                  </h2>
                </div>
              </div>
              <div className="flex gap-4">
                <div className={cn(
                  'flex-1 p-3 rounded-xl',
                  isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
                )}>
                  <p className={cn(
                    'text-xs mb-1',
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  )}>
                    Received
                  </p>
                  <p className={cn(
                    'text-lg font-semibold',
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  )}>
                    +$125
                  </p>
                </div>
                <div className={cn(
                  'flex-1 p-3 rounded-xl',
                  isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
                )}>
                  <p className={cn(
                    'text-xs mb-1',
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  )}>
                    Sent
                  </p>
                  <p className={cn(
                    'text-lg font-semibold',
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  )}>
                    -$125
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'col-span-1 md:col-span-2 p-6 rounded-2xl border backdrop-blur-xl',
                isDarkMode
                  ? 'bg-[#0B1220]/40 border-white/10'
                  : 'bg-white/80 border-[#BCC3EE]/30'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#9B7EE9]" />
                <h3 className={cn(
                  'text-lg font-semibold',
                  isDarkMode ? 'text-white' : 'text-slate-900'
                )}>
                  Exchange Rates
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {EXCHANGE_RATES.map((rate, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'p-4 rounded-xl text-center',
                      isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                    )}
                  >
                    <p className={cn(
                      'text-xs font-medium mb-1',
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    )}>
                      {rate.from} → {rate.to}
                    </p>
                    <p className={cn(
                      'text-lg font-bold',
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    )}>
                      {rate.symbol}{rate.rate.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'col-span-1 md:col-span-2 p-6 rounded-2xl border backdrop-blur-xl',
                isDarkMode
                  ? 'bg-[#0B1220]/40 border-white/10'
                  : 'bg-white/80 border-[#BCC3EE]/30'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn(
                  'text-lg font-semibold',
                  isDarkMode ? 'text-white' : 'text-slate-900'
                )}>
                  Recent Transactions
                </h3>
                <button className={cn(
                  'text-sm font-medium flex items-center gap-1',
                  isDarkMode ? 'text-[#9B7EE9]' : 'text-[#234A80]'
                )}>
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl',
                      isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        tx.type === 'received'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      )}>
                        {tx.type === 'received' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium',
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        )}>
                          {tx.name}
                        </p>
                        <p className={cn(
                          'text-xs',
                          isDarkMode ? 'text-slate-500' : 'text-slate-500'
                        )}>
                          {formatTime(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      'font-semibold',
                      tx.type === 'received'
                        ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        : isDarkMode ? 'text-red-400' : 'text-red-600'
                    )}>
                      {tx.type === 'received' ? '+' : '-'}{tx.currency}{tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}