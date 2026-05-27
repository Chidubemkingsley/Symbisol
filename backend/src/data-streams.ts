import dotenv from 'dotenv';

dotenv.config();

type StreamMessage = {
  type: 'agent_registration' | 'task_created' | 'task_completed' | 'agent_log' | 'payment' | 'system_event';
  timestamp: number;
  data: Record<string, any>;
};

let streamsAvailable = false;

export async function initDataStreams(): Promise<boolean> {
  try {
    const privateKey = process.env.SOMNIA_PRIVATE_KEY;
    if (!privateKey) {
      console.warn('[DATA_STREAMS] No private key — skipping');
      return false;
    }

    // Initialize Somnia Data Streams SDK
    const { SDK, zeroBytes32 } = await import('@somnia-chain/streams');
    const { createPublicClient, createWalletClient, http } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    const { somniaTestnet } = await import('viem/chains');

    const rpcUrl = 'https://dream-rpc.somnia.network';
    const account = privateKeyToAccount(
      privateKey.startsWith('0x') ? (privateKey as `0x${string}`) : `0x${privateKey}`
    );

    const publicClient = createPublicClient({ chain: somniaTestnet, transport: http(rpcUrl) });
    const walletClient = createWalletClient({ chain: somniaTestnet, account, transport: http(rpcUrl) });

    const sdk = new SDK({ public: publicClient, wallet: walletClient });

    streamsAvailable = true;
    console.log('[DATA_STREAMS] Initialized successfully');
    return true;
  } catch (error: any) {
    console.warn('[DATA_STREAMS] Init warning:', error.message);
    return false;
  }
}

export async function publishMessage(message: StreamMessage): Promise<string | null> {
  if (!streamsAvailable) {
    return null;
  }
  // In a real deployment, this would publish to Somnia Data Streams
  console.log(`[DATA_STREAMS] Publishing: ${message.type}`);
  return null;
}

export async function getMessages(type?: string, maxCount: number = 50): Promise<StreamMessage[]> {
  return [];
}

export async function publishAgentEvent(
  eventType: StreamMessage['type'],
  eventData: Record<string, any>
): Promise<string | null> {
  return publishMessage({
    type: eventType,
    timestamp: Date.now(),
    data: eventData,
  });
}
