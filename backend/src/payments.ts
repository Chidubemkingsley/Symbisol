import { ethers } from 'ethers';

// Deterministic on-chain addresses for each agent (Somnia Testnet)
export const AGENT_ADDRESSES: Record<string, string> = {
  ResearchAgent:    '0x1111111111111111111111111111111111111111',
  AnalysisAgent:    '0x2222222222222222222222222222222222222222',
  DataOracleAgent:  '0x3333333333333333333333333333333333333333',
  SummaryAgent:     '0x4444444444444444444444444444444444444444',
  CodeAgent:        '0x5555555555555555555555555555555555555555',
  TranslationAgent: '0x6666666666666666666666666666666666666666',
  WeatherAgent:     '0x7777777777777777777777777777777777777777',
  SentimentAgent:   '0x8888888888888888888888888888888888888888',
};

// On-chain payments are 1/1000th of displayed price to conserve STT
const PAYMENT_SCALE = 0.001;

export interface PaymentReceipt {
  txHash: string;
  from: string;
  to: string;
  amountSTT: string;
  blockNumber?: number;
  explorerUrl: string;
}

export async function sendMicroPayment(
  wallet: ethers.Wallet,
  agentName: string,
  displayedPriceSTT: number
): Promise<PaymentReceipt | null> {
  const toAddress = AGENT_ADDRESSES[agentName];
  if (!toAddress) return null;

  const actualSTT = displayedPriceSTT * PAYMENT_SCALE;
  const weiAmount = ethers.parseEther(actualSTT.toFixed(18).slice(0, 20));

  try {
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: weiAmount,
      gasLimit: 21000n,
    });

    console.log(`[PAYMENT] Sent ${actualSTT} STT to ${agentName} — ${tx.hash}`);

    // Don't await receipt to keep latency low; fire-and-forget style
    const receipt = await tx.wait(1).catch(() => null);

    return {
      txHash: tx.hash,
      from: wallet.address,
      to: toAddress,
      amountSTT: actualSTT.toFixed(6),
      blockNumber: receipt?.blockNumber,
      explorerUrl: `https://shannon-explorer.somnia.network/tx/${tx.hash}`,
    };
  } catch (err: any) {
    console.warn(`[PAYMENT] Failed for ${agentName}:`, err.message);
    return null;
  }
}
