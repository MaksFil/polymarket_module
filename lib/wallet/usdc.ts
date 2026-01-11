import { RelayClient } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { encodeFunctionData, parseUnits, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { env } from "../env";

export async function sendUSDC(to: string, amount: number) {
  try {
    const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: polygon,
      transport: http(env.RPC_URL)
    });

    const builderConfig = new BuilderConfig({
      localBuilderCreds: {
        key: env.API_KEY,
        secret: env.SECRET,
        passphrase: env.PASSPHRASE!,
      }
    });

    const client = new RelayClient(
      env.RELAYER_URL,
      Number(env.CHAIN_ID),
      walletClient,
      builderConfig
    );

    try {
      const responseDeploy = await client.deploy();
      const resultDeploy = await responseDeploy.wait();

      if (resultDeploy?.proxyAddress) {
        console.log("Safe deployed successfully:", resultDeploy.proxyAddress);
      }
    } catch (deployErr: any) {
      console.log("Safe deploy skipped or already exists:", deployErr.message);
    }

    const tx = {
      to: env.USDC_CONTRACT,
      data: encodeFunctionData({
        abi: [{
          name: "transfer",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
          ],
          outputs: [{ type: "bool" }]
        }],
        functionName: "transfer",
        args: [to, parseUnits(amount.toString(), 6)]
      }),
      value: "0"
    };

    const response = await client.execute([tx], "Withdraw USDC");
    const result = await response.wait();

    if (!result?.transactionHash) {
      throw new Error("Transaction failed");
    }

    return { success: true, txHash: result.transactionHash };

  } catch (err: any) {
    console.error("sendUSDC error:", err);
    return { success: false, error: err.message };
  }
}
