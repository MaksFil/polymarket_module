'use server'
import { env } from "../env";
import QRCode from "qrcode";

export async function getDepositInfo(): Promise<DepositInfo> {
  const polymarketAddress = env.ADDRESS;
  if (!polymarketAddress) throw new Error("Missing Polymarket wallet address");

  const depositRes = await fetch("https://bridge.polymarket.com/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: polymarketAddress }),
  });

  if (!depositRes.ok) throw new Error(`Bridge deposit API error: ${depositRes.status}`);
  const depositData = await depositRes.json();
  const addresses: DepositAddresses = depositData.address;

  const assetsRes = await fetch("https://bridge.polymarket.com/supported-assets");
  if (!assetsRes.ok) throw new Error(`Bridge supported assets API error: ${assetsRes.status}`);
  const assetsData = await assetsRes.json();
  const supportedAssets: SupportedAsset[] = assetsData.supportedAssets;

  const qrCodes: Record<string, string> = {};
  for (const [network, address] of Object.entries(addresses)) {
    if (!address) continue;
    const token = supportedAssets.find(a => a.chainName.toLowerCase() === network && a.token.symbol === "USDC");
    const uri = network === "evm" && token
      ? `ethereum:${address}?token=${token.token.address}`
      : address;
    qrCodes[network] = await QRCode.toDataURL(uri);
  }

  return { addresses, qrCodes, supportedAssets };
}
