import * as dbModule from '@/lib/db';
import type { RecipientRow } from '@/lib/db';
const { db, useInMemory } = dbModule;

const defaultRecipients = [
  { name: 'john', wallet: 'GCFX123456789' },
  { name: 'sarah', wallet: 'GABCD456789' },
  { name: 'david', wallet: 'GXYZW789012' },
  { name: 'divine', wallet: 'GCFX2983746510' },
];
let inMemoryRecipients = [...defaultRecipients];

export interface Recipient {
  name: string;
  wallet: string;
}

export function getRecipients(): Recipient[] {
  if (useInMemory) return inMemoryRecipients;
  const rows = db.prepare('SELECT name, wallet FROM recipients').all() as RecipientRow[];
  return rows.map((row) => ({
    name: row.name,
    wallet: row.wallet,
  }));
}

export function addRecipient(name: string, wallet: string): Recipient {
  const newRecipient = { name: name.toLowerCase(), wallet };
  if (useInMemory) {
    inMemoryRecipients.push(newRecipient);
    return newRecipient;
  }
  const stmt = db.prepare('INSERT INTO recipients (name, wallet) VALUES (?, ?)');
  stmt.run(name.toLowerCase(), wallet);
  return newRecipient;
}

export function findRecipientByName(name: string): Recipient | undefined {
  if (useInMemory) {
    return inMemoryRecipients.find(r => r.name.toLowerCase() === name.toLowerCase());
  }
  const row = db.prepare('SELECT name, wallet FROM recipients WHERE LOWER(name) = LOWER(?)').get(name.toLowerCase()) as RecipientRow | undefined;
  if (!row) return undefined;
  return { name: row.name, wallet: row.wallet };
}