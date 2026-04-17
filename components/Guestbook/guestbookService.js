// ---- Guestbook Service ----
// Data layer for the Guestbook, backed by Supabase.
//
//   Supabase table: guestbook_entries
//   ┌──────────────────┬──────────────┐
//   │ column           │ type         │
//   ├──────────────────┼──────────────┤
//   │ id               │ uuid (auto)  │
//   │ name             │ text         │
//   │ message          │ text (null)  │
//   │ signature_data   │ text (null)  │  // base64 PNG
//   │ card_color       │ text (null)  │  // hex string, e.g. '#E8541A'
//   │ pattern          │ text (null)  │  // pattern key
//   │ created_at       │ timestamptz  │
//   └──────────────────┴──────────────┘

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://dbvaqcorhfqvyyvqyoql.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidmFxY29yaGZxdnl5dnF5b3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTE4MjEsImV4cCI6MjA5MTQyNzgyMX0.mDAK8f41sJVrnRx-h6Tqbw1RRUrEbWUIdlLThb_pSEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default card color for entries missing a stored color.
export const DEFAULT_CARD_COLOR = '#E8541A'; // guestbook orange

/**
 * Fetch all guestbook entries, newest first.
 * @returns {Promise<Array<Entry>>}
 */
export async function getEntries() {
  try {
    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(rowToEntry);
  } catch (err) {
    console.error('[Guestbook] getEntries failed:', err);
    return [];
  }
}

/**
 * Add a new guestbook entry.
 * @param {{ name?: string, message?: string, drawData?: string|null, cardColor?: string, pattern?: string }} entry
 * @returns {Promise<Entry|null>} the persisted entry, or null on failure
 */
export async function addEntry(entry) {
  try {
    const row = {
      name: (entry.name || '').trim(),
      message: (entry.message || '').trim() || null,
      signature_data: entry.drawData ?? null,
      card_color: entry.cardColor ?? DEFAULT_CARD_COLOR,
      pattern: entry.pattern ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('guestbook_entries')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToEntry(data);
  } catch (err) {
    console.error('[Guestbook] addEntry failed:', err);
    return null;
  }
}

// ---- Translation helpers ----

/**
 * Convert a Supabase row (snake_case) into our internal Entry shape.
 * @param {object} row
 * @returns {Entry}
 */
export function rowToEntry(row) {
  return {
    id: row.id,
    name: row.name,
    message: row.message ?? null,
    stamp: null,
    drawData: row.signature_data ?? null,
    cardColor: row.card_color ?? DEFAULT_CARD_COLOR,
    pattern: row.pattern ?? null,
    createdAt: row.created_at,
  };
}

/**
 * @typedef {Object} Entry
 * @property {string} id
 * @property {string} name
 * @property {string|null} message
 * @property {string|null} stamp       always null (legacy, kept for compat)
 * @property {string|null} drawData    base64 data URL, or null
 * @property {string} [cardColor]      hex color (e.g. '#E8541A')
 * @property {string|null} [pattern]   pattern key (e.g. 'dash-scatter')
 * @property {string} createdAt        ISO timestamp
 */
