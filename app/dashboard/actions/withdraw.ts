'use server'

import { sendUSDC } from "@/lib/wallet/usdc";

export async function withdrawUSDC(to: string, amount: number) {
  try {
    if (!to) throw new Error("Recipient address is required");
    if (!amount || amount <= 0) throw new Error("Amount must be greater than 0");

    const result = await sendUSDC(to, amount);

    if (!result.success) throw new Error(result.error || "Failed to send USDC");

    return {
      success: true,
      txHash: result.txHash,
    };
  } catch (err: any) {
    console.error("withdrawUSDC server action error:", err);
    return {
      success: false,
      error: err.message || "Unknown error",
    };
  }
}
