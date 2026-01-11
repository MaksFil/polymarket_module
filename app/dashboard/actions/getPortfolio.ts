'use server'

import { getBalance } from "@/lib/polymarket/balance";
import { getPositions, getClosedPositions } from "@/lib/polymarket/positions";

export async function getPortfolio(): Promise<PortfolioResponse> {
  try {
    const portfolioData = await getPositions();
    if (!portfolioData.success) throw new Error(portfolioData.error || "Failed to load positions");

    const positions = portfolioData.positions || [];

    const portfolioNotUSDC = positions.reduce((acc, pos) => {
      if (pos.asset.toLowerCase().includes("usdc")) return acc;
      return acc + Number(pos.currentValue);
    }, 0);

    const balanceInfo = await getBalance();
    const usdcBalance = balanceInfo.success ? balanceInfo.balance || 0 : 0;

    const totalPortfolio = usdcBalance + portfolioNotUSDC;

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const closedPositions = await getClosedPositions();

    const todaysClosedPositions = closedPositions.filter(pos => {
      const posDate = new Date(pos.timestamp * 1000);
      return posDate >= today;
    });

    const todayPnLDollars = todaysClosedPositions.reduce((acc, pos) => acc + Number(pos.realizedPnl), 0);
    const todayPnLPercent = totalPortfolio > 0 ? (todayPnLDollars / totalPortfolio) * 100 : 0;

    return {
      success: true,
      portfolioNotUSDC,
      usdcBalance,
      totalPortfolio,
      todayPnLDollars,
      todayPnLPercent,
      positions,
    };
  } catch (err: any) {
    console.error("loadPortfolio error:", err);
    return { success: false, error: err.message };
  }
}
