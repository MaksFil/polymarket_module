import { ClobClient, AssetType } from "@polymarket/clob-client";
import { Wallet } from "ethers";
import { env } from "../env";

export interface WalletInfo {
  success: boolean;
  balance?: number;
  pnl?: number;
  error?: string;
}

export async function getBalance(): Promise<WalletInfo> {
  try {
    if (!env.PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in .env");

    const signer = new Wallet(env.PRIVATE_KEY);

    const { key, secret, passphrase } = await new ClobClient("https://clob.polymarket.com", 137, signer)
      .createOrDeriveApiKey();

    const client = new ClobClient("https://clob.polymarket.com", 137, signer, {
      key,
      secret,
      passphrase,
    });

    // Получаем баланс и allowance для USDC (COLLATERAL)
    const balanceResponse = await client.getBalanceAllowance({ asset_type: "COLLATERAL" as AssetType });

    return {
      success: true,
      balance: Number(balanceResponse.balance),
    };
  } catch (err: any) {
    console.error("getBalance error:", err);
    return { success: false, error: err.message };
  }
}
