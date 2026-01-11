'use server'

import { getClosedPositions } from "@/lib/polymarket/positions";

export async function getJoinedDate(): Promise<{ success: boolean; joined?: string; error?: string }> {
  try {
    const positions = await getClosedPositions(1, 'TIMESTAMP', 'ASC');
    if (!positions.length) return { success: false, error: "No closed positions found" };

    const firstTx = positions[0];
    const date = new Date(firstTx.timestamp * 1000);

    const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    const formatted = `Joined ${date.toLocaleDateString('en-US', options)}`;

    return { success: true, joined: formatted };
  } catch (err: any) {
    console.error("getJoinedDate error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}
