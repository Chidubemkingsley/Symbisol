import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Symbisol } from '../target/types/symbisol';

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Symbisol as Program<Symbisol>;

  // Initialize global stats
  const [globalStatsPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('global_stats')],
    program.programId
  );

  const globalStatsAccount = await provider.connection.getAccountInfo(globalStatsPda);

  if (!globalStatsAccount) {
    const tx = await program.methods
      .initializeGlobalStats()
      .accounts({
        authority: provider.wallet.publicKey,
        globalStats: globalStatsPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`Global stats initialized. Tx: ${tx}`);
  } else {
    console.log('Global stats already initialized.');
  }

  console.log('Deployment complete!');
  console.log(`Program ID: ${program.programId.toBase58()}`);
}

main().catch(console.error);
