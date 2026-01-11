'use server'

import { getDepositInfo } from "@/lib/polymarket/bridgeDeposit";

export async function generateDepositQR(): Promise<DepositInfo> {
  try {
    const info = await getDepositInfo();
    return info;
  } catch (err: any) {
    console.error("generateDepositQR error:", err);
    throw new Error(err.message);
  }
}
