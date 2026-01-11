'use server'

import { env } from "../env";

/**
 * Get active user positions
 * @param sortDirection - ASC | DESC
 */
export async function getPositions(
  sortDirection: 'ASC' | 'DESC' = 'DESC'
): Promise<PortfolioInfo> {
  try {
    const url = `https://data-api.polymarket.com/positions?user=${env.ADDRESS}&sizeThreshold=1&limit=500&sortBy=TOKENS&sortDirection=${sortDirection}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`);

    const positions: Position[] = await res.json();
    const totalValue = positions.reduce((acc, pos) => acc + Number(pos.currentValue), 0);
    const totalPnL = positions.reduce((acc, pos) => acc + Number(pos.cashPnl), 0);

    return { success: true, positions, totalValue, totalPnL };
  } catch (err: any) {
    console.error("getPositions error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get closed user positions
 */
export async function getClosedPositions(
  limit: number = 50,
  sortBy: 'REALIZEDPNL' | 'TITLE' | 'PRICE' | 'AVGPRICE' | 'TIMESTAMP' = 'TIMESTAMP',
  sortDirection: 'ASC' | 'DESC' = 'DESC',
  offset: number = 0
): Promise<ClosedPosition[]> {
  try {
    const url = `https://data-api.polymarket.com/v1/closed-positions?user=${env.ADDRESS}&limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Polymarket closed-positions API error: ${res.status}`);
    const positions: ClosedPosition[] = await res.json();
    return positions;
  } catch (err) {
    console.error("getClosedPositions error:", err);
    return [];
  }
}