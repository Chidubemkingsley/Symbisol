import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

const SOLANA_EXPLORER_TX = 'https://explorer.solana.com/tx';
const LAMPORTS_PER_USDC = 1_000_000; // USDC has 6 decimals

export function getSolanaExplorerUrl(txSignature: string, network: string): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `${SOLANA_EXPLORER_TX}/${txSignature}${cluster}`;
}

export function solToLamports(amount: number): number {
  return Math.round(amount * LAMPORTS_PER_SOL);
}

export function usdcToLamports(amount: number): number {
  return Math.round(amount * LAMPORTS_PER_USDC);
}

export function getDefaultUSDCContract(network: string): string {
  return network === 'mainnet-beta'
    ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC mainnet
    : 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'; // USDC devnet
}

export interface PaymentInfo {
  transaction: string;
  payer: string;
  network: string;
}

export function decodePaymentResponse(header: string): PaymentInfo | null {
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export function encodePaymentResponse(info: PaymentInfo): string {
  return Buffer.from(JSON.stringify(info)).toString('base64');
}

export interface PaymentConfig {
  amount: number;
  payTo: string;
  network: string;
  description: string;
  tokenType?: 'SOL' | 'USDC';
  tokenContract?: string;
}

export function createSolanaPaymentMiddleware(config: PaymentConfig) {
  const network = config.network || 'devnet';
  const connection = new Connection(
    network === 'mainnet-beta'
      ? clusterApiUrl('mainnet-beta')
      : network === 'testnet'
        ? clusterApiUrl('testnet')
        : clusterApiUrl('devnet'),
    'confirmed'
  );

  return async (req: any, res: any, next: any) => {
    const incomingPaymentSig = req.headers['x-solana-signature'] as string;

    if (process.env.SIMULATION_MODE === 'true') {
      next();
      return;
    }

    if (!incomingPaymentSig) {
      const paymentPayload = {
        amount: config.amount,
        token: config.tokenType || 'SOL',
        recipient: config.payTo,
        description: config.description,
        network,
        tokenContract: config.tokenContract,
      };

      res.status(402).json({
        error: 'Payment Required',
        message: `x402 Payment Required — ${config.amount / (config.tokenType === 'USDC' ? LAMPORTS_PER_USDC : LAMPORTS_PER_SOL)} ${config.tokenType || 'SOL'}`,
        payment: paymentPayload,
      });
      return;
    }

    try {
      const signature = incomingPaymentSig;

      // Poll for the transaction with retries — avoids the legacy 30s timeout
      // of confirmTransaction(signature, commitment). The tx was already sent
      // by the frontend wallet, so we just need to verify it exists on-chain.
      let tx = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        tx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        if (tx) break;
        await new Promise(r => setTimeout(r, 3000));
      }
      if (!tx) {
        res.status(402).json({ error: 'Transaction not found or not yet confirmed. Please retry.' });
        return;
      }
      if (tx.meta?.err) {
        res.status(402).json({ error: 'Transaction failed on-chain', detail: tx.meta.err });
        return;
      }

      const postBalance = tx.meta?.postBalances?.[0] || 0;
      const preBalance = tx.meta?.preBalances?.[0] || 0;
      const transferred = preBalance - postBalance - (tx.meta?.fee || 0);

      if (transferred < config.amount) {
        res.status(402).json({
          error: 'Insufficient payment',
          expected: config.amount,
          received: transferred,
        });
        return;
      }

      const message = tx.transaction.message;
      const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
      let recipient = message.staticAccountKeys[1]?.toBase58();
      for (const ix of message.instructions) {
        const progId = message.staticAccountKeys[ix.programIdIndex]?.toBase58();
        if (progId === SYSTEM_PROGRAM_ID && ix.accounts.length >= 2) {
          recipient = message.staticAccountKeys[ix.accounts[1]]?.toBase58();
          break;
        }
      }
      if (recipient && recipient !== config.payTo) {
        res.status(402).json({
          error: 'Payment sent to wrong recipient',
          expected: config.payTo,
          received: recipient,
        });
        return;
      }

      (req as any).payment = {
        transaction: signature,
        payer: tx.transaction.message.staticAccountKeys[0]?.toBase58(),
        network,
      };

      next();
    } catch (err: any) {
      console.error('[SOLANA_PAYMENT] Error:', err.message);
      res.status(402).json({ error: 'Payment verification failed', detail: err.message });
    }
  };
}

export function getSolanaRpcUrl(network: string): string {
  switch (network) {
    case 'mainnet-beta': return clusterApiUrl('mainnet-beta');
    case 'testnet': return clusterApiUrl('testnet');
    case 'devnet':
    default: return clusterApiUrl('devnet');
  }
}
