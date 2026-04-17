'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';
import { QuickActionButtons } from '@/components/QuickActionButtons';
import { RecipientModal } from '@/components/RecipientModal';
import { Toast } from '@/components/Toast';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useWallet } from '@/context/WalletContext';
import type { Message, IntentResult, TransactionData, ConversionData, Recipient, ChatState, ConfirmationData, Alert, Transaction } from '@/types';

const DEFAULT_RECIPIENTS: Recipient[] = [
  { id: '1', name: 'John', walletAddress: 'GCFX1827394710' },
  { id: '2', name: 'Divine', walletAddress: 'GCFX2983746510' },
  { id: '3', name: 'Sarah', walletAddress: 'GCFX4738291028' },
  { id: '4', name: 'David', walletAddress: 'GCFX9283746510' },
];

const SAMPLE_SENDERS = ['Sarah', 'John', 'David', 'Divine', 'Michael'];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function detectIntent(text: string): IntentResult {
  const lowerText = text.toLowerCase();
  
  const sendMatch = lowerText.match(/send\s+\$?(\d+)\s+(?:to\s+)?(\w+)/i);
  if (sendMatch) {
    return {
      type: 'send_money',
      data: {
        amount: parseInt(sendMatch[1], 10),
        recipient: sendMatch[2],
      },
    };
  }
  
  const convertMatch = lowerText.match(/convert\s+\$?(\d+)\s+(?:from\s+)?(\w+)?\s+(?:to\s+)?(\w+)/i);
  if (convertMatch) {
    const toCurrencyRaw = convertMatch[3] || 'NGN';
    let toCurrency = toCurrencyRaw;
    if (['naira', 'nairas'].includes(toCurrencyRaw.toLowerCase())) {
      toCurrency = 'NGN';
    }
    const fromCurrencyRaw = convertMatch[2] || 'USD';
    let fromCurrency = fromCurrencyRaw;
    if (['dollar', 'dollars', 'usd'].includes(fromCurrencyRaw.toLowerCase())) {
      fromCurrency = 'USD';
    }
    return {
      type: 'convert_currency',
      data: {
        amount: parseInt(convertMatch[1], 10),
        fromCurrency,
        toCurrency,
      },
    };
  }
  
  const quickConvertMatch = lowerText.match(/(\w+)\s+to\s+(\w+)/i);
  if (quickConvertMatch) {
    let from = quickConvertMatch[1].toUpperCase();
    let to = quickConvertMatch[2].toUpperCase();
    if (['naira', 'nairas'].includes(quickConvertMatch[2].toLowerCase())) {
      to = 'NGN';
    }
    if (['dollar', 'dollars'].includes(quickConvertMatch[1].toLowerCase())) {
      from = 'USD';
    }
    if (from && to) {
      return {
        type: 'convert_currency',
        data: {
          amount: 100,
          fromCurrency: from,
          toCurrency: to,
        },
      };
    }
  }
  
  return { type: 'unknown' };
}

function shortenWallet(address: string): string {
  if (address.length > 12) {
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  }
  return address;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [pendingTransaction, setPendingTransaction] = useState<{
    recipientName: string;
    amount: number;
    walletAddress?: string;
    saveName?: string;
  } | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [modalDefaults, setModalDefaults] = useState({ name: '', wallet: '' });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isRatesLoading, setIsRatesLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipientUsageCount, setRecipientUsageCount] = useState<Record<string, number>>({});
  const [insightTriggered, setInsightTriggered] = useState(false);
  const { speak } = useSpeechSynthesis(voiceEnabled);
  const { sendPayment: sendPaymentToBackend, addFunds, refreshBalance } = useWallet();
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('remitx-dark-mode');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('remitx-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const savedRecipients = localStorage.getItem('remitx-recipients');
    if (savedRecipients) {
      try {
        setRecipients(JSON.parse(savedRecipients));
      } catch {
        setRecipients(DEFAULT_RECIPIENTS);
      }
    } else {
      setRecipients(DEFAULT_RECIPIENTS);
      localStorage.setItem('remitx-recipients', JSON.stringify(DEFAULT_RECIPIENTS));
    }
  }, []);

  useEffect(() => {
    const savedTransactions = localStorage.getItem('remitx-transactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch {
        setTransactions([]);
      }
    }
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('remitx-transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    const balance = localStorage.getItem('remitx-balance');
    if (!balance) {
      localStorage.setItem('remitx-balance', '250');
    }
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('/api/rates');
        const data = await res.json();
        if (data.rates) {
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch rates:', error);
      } finally {
        setIsRatesLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkRateInsight = () => {
      const currentNgnRate = exchangeRates['NGN'];
      if (!currentNgnRate) return;
      
      const message = `The current naira rate is ${currentNgnRate} naira per dollar. This might be a good time to convert.`;
      const insightMessage: Message = {
        id: generateId(),
        role: 'ai',
        content: message,
        timestamp: new Date(),
        type: 'insight',
      };
      setMessages(prev => [...prev, insightMessage]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
      }
    };
    
    const rateInsightInterval = setInterval(checkRateInsight, 210000);
    return () => clearInterval(rateInsightInterval);
  }, [exchangeRates]);

  useEffect(() => {
    alertIntervalRef.current = setInterval(async () => {
      if (Math.random() > 0.7) {
        const sender = SAMPLE_SENDERS[Math.floor(Math.random() * SAMPLE_SENDERS.length)];
        const amount = Math.floor(Math.random() * 100) + 10;
        
        try {
          await addFunds(amount, `Received from ${sender}`);
        } catch (error) {
          console.error('Failed to add incoming funds:', error);
        }
        
        const newAlert: Alert = {
          id: generateId(),
          type: 'incoming',
          title: 'Incoming Payment',
          message: `You received $${amount} from ${sender}`,
          timestamp: new Date(),
          read: false,
        };
        
        setAlerts(prev => [...prev, newAlert]);
      }
    }, 120000);
    
    return () => {
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [addFunds]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance('Hello, I am RemitX AI. How can I help you?');
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      setTimeout(() => synth.speak(utterance), 500);
    }
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  }, []);

  const findRecipient = (name: string) => {
    return recipients.find(r => r.name.toLowerCase() === name.toLowerCase());
  };

  const addRecipient = useCallback(async (name: string, walletAddress: string) => {
    try {
      const response = await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, wallet: walletAddress }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const newRecipient: Recipient = {
          id: generateId(),
          name,
          walletAddress,
        };
        const updatedRecipients = [...recipients, newRecipient];
        setRecipients(updatedRecipients);
        localStorage.setItem('remitx-recipients', JSON.stringify(updatedRecipients));
        
        if (data.balance) {
          await refreshBalance();
        }
      }
    } catch (error) {
      console.error('Failed to add recipient to backend:', error);
    }
  }, [recipients, refreshBalance]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  const triggerInsight = useCallback((type: 'rate' | 'frequent', message: string) => {
    const insightMessage: Message = {
      id: generateId(),
      role: 'ai',
      content: message,
      timestamp: new Date(),
      type: 'insight',
    };
    
    setMessages(prev => [...prev, insightMessage]);
    
    const insightAlert: Alert = {
      id: generateId(),
      type: 'insight',
      title: 'AI Insight',
      message: message,
      timestamp: new Date(),
      read: false,
    };
    
    setAlerts(prev => [...prev, insightAlert]);
    
    if (voiceEnabled) {
      speak(message);
    }
  }, [voiceEnabled, speak]);

  const handleConfirmPayment = useCallback(async () => {
    if (!pendingTransaction) return;
    
    const { recipientName, amount } = pendingTransaction;
    
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'user',
      content: 'Confirm',
      timestamp: new Date(),
    }]);
    
    setIsTyping(true);
    
    try {
      const result = await sendPaymentToBackend(recipientName, amount);
      
      if (result.success) {
        const transactionData: TransactionData = {
          recipient: recipientName,
          amount: amount,
          currency: '$',
          status: 'success',
          type: 'sent',
        };
        
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Successfully sent $${amount} to ${recipientName}!`,
          timestamp: new Date(),
          type: 'transaction',
          transactionData,
        };
        
        setMessages(prev => [...prev, response]);
        
        const newTransaction: Transaction = {
          id: generateId(),
          name: recipientName,
          amount: amount,
          currency: '$',
          status: 'sent',
          type: 'sent',
          timestamp: new Date(),
        };
        
        setTransactions(prev => [newTransaction, ...prev].slice(0, 10));
        
        const newUsageCount = { ...recipientUsageCount };
        newUsageCount[recipientName.toLowerCase()] = (newUsageCount[recipientName.toLowerCase()] || 0) + 1;
        setRecipientUsageCount(newUsageCount);
        
        if (newUsageCount[recipientName.toLowerCase()] === 3 && !insightTriggered) {
          setInsightTriggered(true);
          setTimeout(() => {
            triggerInsight('frequent', `You've sent money to ${recipientName} multiple times. Would you like to automate this as a weekly transfer?`);
          }, 2000);
        }
        
        if (voiceEnabled) {
          speak(response.content);
        }
      } else {
        const errorMessage: Message = {
          id: generateId(),
          role: 'ai',
          content: result.message || 'Payment failed. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        
        if (voiceEnabled) {
          speak(result.message || 'Payment failed');
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'ai',
        content: 'An error occurred while processing your payment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setPendingTransaction(null);
      setChatState('idle');
    }
  }, [pendingTransaction, voiceEnabled, speak, recipientUsageCount, insightTriggered, triggerInsight, sendPaymentToBackend]);

  const handleCancelPayment = useCallback(() => {
    if (!pendingTransaction) return;
    
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'user',
      content: 'Cancel',
      timestamp: new Date(),
    }]);
    
    setTimeout(() => {
      const response: Message = {
        id: generateId(),
        role: 'ai',
        content: 'Transaction cancelled. How can I help you?',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, response]);
      setPendingTransaction(null);
      setChatState('idle');
      
      if (voiceEnabled) {
        speak(response.content);
      }
    }, 500);
  }, [pendingTransaction, voiceEnabled, speak]);

  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    setTimeout(() => {
      const lowerContent = content.toLowerCase();
      
      if (chatState === 'awaiting_wallet' && pendingTransaction) {
        const walletMatch = content.match(/^[A-Z0-9]{10,}$/i);
        if (walletMatch || content.length > 8) {
          const walletAddress = content.trim().toUpperCase();
          
          const updatedPending = { ...pendingTransaction, walletAddress };
          setPendingTransaction(updatedPending);
          
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Do you want to save this as ${updatedPending.recipientName}?`,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, response]);
          setChatState('awaiting_save_confirmation');
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        } else if (lowerContent === 'yes' || lowerContent === 'skip') {
          setShowRecipientModal(true);
          setModalDefaults({
            name: pendingTransaction.recipientName,
            wallet: ''
          });
          setIsTyping(false);
          return;
        } else {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: "Please provide a valid wallet address.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          return;
        }
      }
      
      if (chatState === 'awaiting_save_confirmation' && pendingTransaction) {
        if (lowerContent === 'yes' || lowerContent === 'y') {
          addRecipient(pendingTransaction.recipientName, pendingTransaction.walletAddress!);
          
          const confirmMessage: Message = {
            id: generateId(),
            role: 'ai',
            content: `${pendingTransaction.recipientName} has been saved. Ready to send $${pendingTransaction.amount} to ${pendingTransaction.recipientName} (${shortenWallet(pendingTransaction.walletAddress!)})?`,
            timestamp: new Date(),
            type: 'confirmation',
            confirmationData: {
              recipientName: pendingTransaction.recipientName,
              walletAddress: pendingTransaction.walletAddress!,
              amount: pendingTransaction.amount,
              currency: '$',
            },
          };
          
          setMessages(prev => [...prev, confirmMessage]);
          setChatState('confirming_payment');
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(confirmMessage.content);
          }
          return;
        } else if (lowerContent === 'no' || lowerContent === 'n') {
          const transactionData: TransactionData = {
            recipient: pendingTransaction.recipientName,
            amount: pendingTransaction.amount,
            currency: '$',
            status: 'success',
            type: 'sent',
          };
          
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Sending $${pendingTransaction.amount} to ${pendingTransaction.recipientName}...`,
            timestamp: new Date(),
            type: 'transaction',
            transactionData,
          };
          
          setMessages(prev => [...prev, response]);
          setPendingTransaction(null);
          setChatState('idle');
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        } else {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Please answer yes or no.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          return;
        }
      }
      
      if (chatState === 'confirming_payment') {
        if (lowerContent === 'yes' || lowerContent === 'confirm') {
          handleConfirmPayment();
          return;
        } else if (lowerContent === 'no' || lowerContent === 'cancel') {
          handleCancelPayment();
          return;
        }
      }
      
      const intent = detectIntent(content);
      
      if (intent.type === 'send_money' && intent.data) {
        const { amount, recipient } = intent.data;
        const foundRecipient = findRecipient(recipient!);
        
        if (foundRecipient) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Send $${amount} to ${foundRecipient.name} (${shortenWallet(foundRecipient.walletAddress)})?`,
            timestamp: new Date(),
            type: 'confirmation',
            confirmationData: {
              recipientName: foundRecipient.name,
              walletAddress: foundRecipient.walletAddress,
              amount: amount!,
              currency: '$',
            },
          };
          
          setPendingTransaction({
            recipientName: foundRecipient.name,
            amount: amount!,
            walletAddress: foundRecipient.walletAddress,
          });
          setChatState('confirming_payment');
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        } else {
          setPendingTransaction({
            recipientName: recipient!,
            amount: amount!,
          });
          setChatState('awaiting_wallet');
          
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `I don't have ${recipient} saved. Please provide a wallet address.`,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        }
      }
      
      if (intent.type === 'convert_currency' && intent.data) {
        const { amount, fromCurrency } = intent.data;
        let { toCurrency } = intent.data;
        
        const from = fromCurrency?.toUpperCase() || 'USD';
        let to = toCurrency?.toUpperCase() || 'NGN';
        
        const validCurrencies = ['USD', 'NGN', 'EUR', 'GBP', 'JPY', 'XLM'];
        
        if (!validCurrencies.includes(from) || !validCurrencies.includes(to)) {
          const invalidCurrencies = [from, to].filter(c => !validCurrencies.includes(c));
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `I can't convert ${invalidCurrencies.join(', ')}. Supported currencies are: USD, NGN (Naira), EUR, GBP, JPY, XLM. Try 'Convert $100 to Naira'`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        }
        
        const fromRate = exchangeRates[from] || 1;
        const toRate = exchangeRates[to] || 1;
        const rate = toRate / fromRate;
        
        const toAmount = (amount || 100) * rate;
        
        const conversionData: ConversionData = {
          fromAmount: amount || 100,
          fromCurrency: fromCurrency?.toUpperCase() || 'USD',
          toAmount: Math.round(toAmount * 100) / 100,
          toCurrency: toCurrency?.toUpperCase() || toCurrency?.toUpperCase() || 'NGN',
          rate,
        };
        
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Converting ${conversionData.fromAmount} ${conversionData.fromCurrency} to ${conversionData.toCurrency} at rate ${rate}...`,
          timestamp: new Date(),
          type: 'conversion',
          conversionData,
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        
        if (voiceEnabled) {
          speak(response.content);
        }
        return;
      }
      
      if (lowerContent === 'check rates' || lowerContent === 'show rates' || lowerContent === 'exchange rates') {
        const ngnRate = exchangeRates['NGN'] || 1400;
        const eurRate = exchangeRates['EUR'] || 0.92;
        const gbpRate = exchangeRates['GBP'] || 0.79;
        const xlmRate = exchangeRates['XLM'] || 0.0035;
        
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Current exchange rates:\n\n💵 USD → NGN: ₦${ngnRate.toLocaleString()}\n💶 EUR → NGN: ₦${Math.round(ngnRate / eurRate).toLocaleString()}\n💷 GBP → NGN: ₦${Math.round(ngnRate / gbpRate).toLocaleString()}\n⭐ XLM → NGN: ₦${Math.round(ngnRate * xlmRate).toLocaleString()}\n\nWould you like to convert any currency?`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        
        if (voiceEnabled) {
          speak('Here are the current exchange rates');
        }
        return;
      }
      
      const responses = [
        "I can help you send money or convert currencies. Try saying 'Send $50 to John' or 'Convert $100 to Naira'",
        "I understand you want to make a transaction. For sending money, say 'Send $50 to John'. For conversion, say 'Convert $100 to Euro'",
        "I'm here to help with cross-border payments. Would you like to send money or convert currency?",
      ];
      
      const response: Message = {
        id: generateId(),
        role: 'ai',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
      
      if (voiceEnabled) {
        speak(response.content);
      }
    }, 800);
  }, [chatState, pendingTransaction, voiceEnabled, speak, addRecipient, handleConfirmPayment, handleCancelPayment]);

  const handleQuickAction = useCallback((command: string) => {
    handleSendMessage(command);
  }, [handleSendMessage]);

  const handleOpenRecipientModal = () => {
    setModalDefaults({ name: '', wallet: '' });
    setShowRecipientModal(true);
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
        `}>
          <div className={`
            absolute inset-0 animate-pulse
            ${isDarkMode 
              ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(78,186,242,0.15),transparent_50%)]' 
              : 'bg-[radial-gradient(circle_at_50%_0%,rgba(78,186,242,0.1),transparent_50%)]'
            }
          `} />
        </div>

        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          isVoiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoice}
        />

        <main className="relative z-10 pt-24 pb-6 px-4 max-w-2xl mx-auto min-h-screen flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              flex-1 rounded-3xl border backdrop-blur-xl overflow-hidden
              ${isDarkMode 
                ? 'bg-[#0B1220]/40 border-white/10 shadow-2xl shadow-[#9B7EE9]/10' 
                : 'bg-white/80 border-[#BCC3EE]/30 shadow-xl shadow-[#9B7EE9]/5'
              }
            `}
          >
            <ChatContainer
              messages={messages}
              isDarkMode={isDarkMode}
              isTyping={isTyping}
              onConfirmPayment={handleConfirmPayment}
              onCancelPayment={handleCancelPayment}
            />

            <div className="p-4 border-t border-inherit">
              <QuickActionButtons
                onAction={handleQuickAction}
                isDarkMode={isDarkMode}
                onOpenRecipientModal={handleOpenRecipientModal}
              />
              <div className="mt-3">
                <ChatInput
                  onSubmit={handleSendMessage}
                  isDarkMode={isDarkMode}
                  isVoiceEnabled={voiceEnabled}
                />
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      <Toast alerts={alerts} onDismiss={dismissAlert} isDarkMode={isDarkMode} />

      <RecipientModal
        isOpen={showRecipientModal}
        onClose={() => setShowRecipientModal(false)}
        onSave={addRecipient}
        isDarkMode={isDarkMode}
        defaultName={modalDefaults.name}
        defaultWallet={modalDefaults.wallet}
      />
    </div>
  );
}