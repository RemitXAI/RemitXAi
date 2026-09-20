'use client';

import { motion } from 'framer-motion';
import { Send, ArrowRightLeft, Users, Wallet, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonsProps {
  onAction: (command: string) => void;
  isDarkMode?: boolean;
  onOpenRecipientModal?: () => void;
}

// Off-ramp and Add Bank remain in the codebase (backend and helpers),
// but are hidden from the UI for now by only exposing the primary actions here.
const actions = [
  { label: 'Send Money', command: 'Send money', icon: Send },
  { label: 'Convert Currency', command: 'Convert currency', icon: ArrowRightLeft },
  { label: 'Add Recipient', command: '', icon: Users, isModal: true },
];

export function QuickActionButtons({ onAction, isDarkMode, onOpenRecipientModal }: QuickActionButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (action.isModal && onOpenRecipientModal) {
              onOpenRecipientModal();
            } else {
              onAction(action.command);
            }
          }}
          className={cn(
            // make buttons evenly distribute: allow them to grow and center content
            'basis-0 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium min-w-0',
            'transition-all duration-200 gradient-bg text-white hover:shadow-lg hover:shadow-[#9B7EE9]/30'
          )}
        >
          <action.icon className="w-4 h-4" />
          <span className="truncate">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}