'use server'

import { fullCache, startCacheForUser } from "@/lib/polymarket/cache";
import { env } from "@/lib/env";

const CACHE_TTL = 60_000; // cache 60 seconds

export async function getPnL(
  timeframe: '1H' | '6H' | '1D' | '1W' | '1M' | 'All' = '1D'
): Promise<PnlResponse> {

  const publicKey = env.ADDRESS;
  const nowSec = Math.floor(Date.now() / 1000);

  startCacheForUser();

  const cached = fullCache[publicKey]?.pnlCache?.[timeframe];
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const closed = fullCache[publicKey]?.data ?? [];
  const timeline: PnlPoint[] = [];
  let cumulative = 0;

  for (const pos of closed) {
    cumulative += pos.realizedPnl;
    timeline.push({ timestamp: pos.timestamp, value: cumulative });
  }

  let startTs = 0;
  if (timeframe !== "All") {
    const map: Record<'1H' | '6H' | '1D' | '1W' | '1M' | 'All', number> = {
      '1H': 3600,
      '6H': 3600 * 6,
      '1D': 3600 * 24,
      '1W': 3600 * 24 * 7,
      '1M': 3600 * 24 * 30,
      'All': 0
    };
    startTs = nowSec - map[timeframe];
  }

  let baseValue = 0;
  let hasActivityInRange = false;
  const graph: PnlPoint[] = [];

  for (const p of timeline) {
    if (p.timestamp < startTs) {
      baseValue = p.value;
    } else {
      hasActivityInRange = true;
      graph.push(p);
    }
  }

  if (!hasActivityInRange) {
    graph.push({ timestamp: startTs, value: 0 });
    graph.push({ timestamp: nowSec, value: 0 });
  } else {
    graph.unshift({ timestamp: startTs, value: baseValue });
  }

  const current = timeline[timeline.length - 1]?.value ?? 0;
  const change = current - baseValue;

  const values = graph.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.1 || 1;

  const result: PnlResponse = {
    success: true,
    data: {
      current,
      change,
      graph,
      graphMin: min - pad,
      graphMax: max + pad
    }
  };

  if (!fullCache[publicKey]) fullCache[publicKey] = { data: [], lastTimestamp: 0, loading: false, pnlCache: {} };
  fullCache[publicKey].pnlCache[timeframe] = { ts: Date.now(), data: result };

  return result;
}
