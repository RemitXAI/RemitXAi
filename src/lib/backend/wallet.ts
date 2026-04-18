import * as dbModule from '@/lib/db';
import type { WalletRow, TransactionRow } from '@/lib/db';
const { db, useInMemory, inMemoryWallet, inMemoryTransactions } = dbModule;

let nextTxId = 1;

export function getBalance(): number {
  if (useInMemory) return inMemoryWallet.balance;
  const wallet = db.prepare('SELECT balance FROM wallet WHERE id = 1').get() as WalletRow;
  return wallet?.balance ?? 0;
}

export function getTransactions(limit = 20): TransactionRow[] {
  if (useInMemory) return inMemoryTransactions.slice(0, limit);
  return db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?').all(limit) as TransactionRow[];
}

export function deduct(amount: number): boolean {
  if (useInMemory) {
    if (amount > inMemoryWallet.balance) return false;
    inMemoryWallet.balance -= amount;
    return true;
  }
  const wallet = db.prepare('SELECT balance FROM wallet WHERE id = 1').get() as WalletRow;
  if (!wallet || amount > wallet.balance) return false;
  db.prepare('UPDATE wallet SET balance = balance - ? WHERE id = 1').run(amount);
  return true;
}

export function add(amount: number, description: string): void {
  if (useInMemory) {
    inMemoryWallet.balance += amount;
    inMemoryTransactions.push({
      id: nextTxId++,
      recipient: description,
      amount,
      type: 'receive',
      created_at: new Date().toISOString(),
    });
    return;
  }
  db.prepare('UPDATE wallet SET balance = balance + ? WHERE id = 1').run(amount);
  db.prepare('INSERT INTO transactions (recipient, amount, type) VALUES (?, ?, ?)').run(description, amount, 'receive');
}

export function recordTransaction(recipient: string, amount: number, type: 'send' | 'receive'): void {
  if (useInMemory) {
    inMemoryTransactions.push({
      id: nextTxId++,
      recipient,
      amount,
      type,
      created_at: new Date().toISOString(),
    });
    return;
  }
  db.prepare('INSERT INTO transactions (recipient, amount, type) VALUES (?, ?, ?)').run(recipient, amount, type);
}