import { getClosedPositions } from "./positions";
import { env } from "../env";

export type CacheEntry = {
  data: ClosedPosition[];
  lastTimestamp: number;
  loading: boolean;
  pnlCache: Record<string, any>;
};

export const fullCache: Record<string, CacheEntry> = {};

const PAGE_SIZE = 50;
const REFRESH_INTERVAL = 30_000;

/**
 * Load all history
 */
async function loadFullHistory(publicKey: string) {
  let offset = 0;
  const pages: ClosedPosition[][] = [];

  while (true) {
    const batch = await getClosedPositions(
      PAGE_SIZE,
      "TIMESTAMP",
      "DESC",
      offset
    );

    if (!batch.length) break;

    pages.push(batch);

    if (batch.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;

  }

  const all = pages.flat();

  all.sort((a, b) => a.timestamp - b.timestamp);

  const lastTimestamp = all.length ? all[all.length - 1].timestamp : 0;

  fullCache[publicKey] = {
    data: all,
    lastTimestamp,
    loading: false,
    pnlCache: {}
  };
}

/**
 * Load new PnL
 */
async function refreshHistory(publicKey: string) {
  const entry = fullCache[publicKey];
  if (!entry || entry.loading) return;

  entry.loading = true;

  try {
    const fresh = await getClosedPositions(
      PAGE_SIZE,
      "TIMESTAMP",
      "DESC",
      0
    );

    const newItems = fresh.filter(p => p.timestamp > entry.lastTimestamp);

    if (!newItems.length) {
      return;
    }

    entry.data.push(...newItems);
    entry.data.sort((a, b) => a.timestamp - b.timestamp);
    entry.lastTimestamp = entry.data[entry.data.length - 1].timestamp;

    entry.pnlCache = {};

  } catch (e) {
    console.error("Refresh error:", e);
  } finally {
    entry.loading = false;
  }
}

/**
 * Load cache system on start
 */
export function startCacheForUser() {
  const publicKey = env.ADDRESS;

  if (fullCache[publicKey]) return;

  fullCache[publicKey] = {
    data: [],
    lastTimestamp: 0,
    loading: true,
    pnlCache: {}
  };

  loadFullHistory(publicKey).catch(console.error);

  setInterval(() => refreshHistory(publicKey), REFRESH_INTERVAL);
}
