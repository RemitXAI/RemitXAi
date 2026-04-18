import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;
let useInMemory = false;
let inMemoryWallet = { balance: 500 };
let inMemoryTransactions: { id: number; recipient: string; amount: number; type: 'send' | 'receive'; created_at: string }[] = [];

try {
  const DB_PATH = path.join(process.cwd(), 'remitx.db');
  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      balance REAL NOT NULL DEFAULT 500
    );

    CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      wallet TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('send', 'receive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const walletExists = db.prepare('SELECT COUNT(*) as count FROM wallet').get() as { count: number };
  if (walletExists.count === 0) {
    db.prepare('INSERT INTO wallet (id, balance) VALUES (1, 500)').run();
  }

  const recipientsExist = db.prepare('SELECT COUNT(*) as count FROM recipients').get() as { count: number };
  if (recipientsExist.count === 0) {
    const insertRecipient = db.prepare('INSERT INTO recipients (name, wallet) VALUES (?, ?)');
    insertRecipient.run('john', 'GCFX123456789');
    insertRecipient.run('sarah', 'GABCD456789');
    insertRecipient.run('david', 'GXYZW789012');
  }
} catch (error) {
  console.log('SQLite not available, using in-memory demo mode');
  useInMemory = true;
}

export { db, useInMemory, inMemoryWallet, inMemoryTransactions };

export interface WalletRow {
  id: number;
  balance: number;
}

export interface RecipientRow {
  id: number;
  name: string;
  wallet: string;
}

export interface TransactionRow {
  id: number;
  recipient: string;
  amount: number;
  type: 'send' | 'receive';
  created_at: string;
}