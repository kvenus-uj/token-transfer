import * as anchor from"@project-serum/anchor";
import { Connection, PublicKey,sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import * as splToken from "@solana/spl-token";
import idl from './idl.json';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
const programID = new PublicKey(idl.metadata.address);
const tokenMintPubkey = new PublicKey('8hziHSv33pNMBgMYbcCLmxbpRTsH28YxZNe9dyW84NvA');
async function getProvider(wallet) {
	const network = "https://metaplex.devnet.rpcpool.com";
	const connection = new Connection(network, 'processed');

	const provider = new Provider(
		connection, wallet, 'processed',
	);
	return provider;
}

export const executeAllTransactions = async (
    connection,
    wallet,
    transactions,
  ) => {
    if (transactions.length === 0) return []
    const recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash
    for (let tx of transactions) {
      tx.feePayer = wallet.publicKey
      tx.recentBlockhash = recentBlockhash
    }
    await wallet.signAllTransactions(transactions)
  
    const txIds = await Promise.all(
      transactions.map(async (tx, index) => {
        try {
          const txid = await sendAndConfirmRawTransaction(
            connection,
            tx.serialize(),
          )
          return txid
        } catch (e) {
          return null
        }
      })
    )
    console.log(txIds);
    return txIds
  }

export const sendToken = async (wallet, amount, toPubkeyAddr) => {
  const provider = await getProvider(wallet);
	const program = new Program(idl, programID, provider);
  const token_amount = new anchor.BN(amount).mul(new anchor.BN(1e6));
  const toPubkey = new PublicKey(toPubkeyAddr);
  const txs = [];
  const transaction = new Transaction();
  const fromAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    tokenMintPubkey,
    wallet.publicKey,
    wallet.publicKey,
    true
  );  
  const toAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    tokenMintPubkey,
    toPubkey,
    wallet.publicKey,
    true
  );  
  transaction.add(program.instruction.sendToken(token_amount,
    {
      accounts: {
        tokenFrom: fromAccount,
        tokenTo: toAccount,
        fromAuthority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    }))  
  txs.push(transaction);
  try {
    await executeAllTransactions(
      provider.connection,
      wallet,
      txs,
    );
  } catch (e) {
    console.log(e);
  }
}

export const testMint = async (wallet) => {
  const provider = await getProvider(wallet);
	const program = new Program(idl, programID, provider);
  const [tokenVaultPubkey, tokenVaultBump] =
  await web3.PublicKey.findProgramAddress(
    [tokenMintPubkey.toBuffer()],
    program.programId
  );
  const txs = [];
  const transaction = new Transaction();
  const userTokenAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    tokenMintPubkey,
    wallet.publicKey,
    wallet.publicKey,
    true
  );  
  transaction.add(program.instruction.mintTo(
    tokenVaultBump,
    new anchor.BN(100e9),
    {
      accounts: {
        tokenMint: tokenMintPubkey,
        tokenVault: tokenVaultPubkey,
        tokenTo: userTokenAccount,
        tokenToAuthority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    }
  ))  
  txs.push(transaction);
  try {
    await executeAllTransactions(
      provider.connection,
      wallet,
      txs,
    );
  } catch (e) {
    console.log(e);
  }
}

export async function withFindOrInitAssociatedTokenAccount(
  transaction,
  connection,
  mint,
  owner,
  payer,
  allowOwnerOffCurve
) {
  const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner,
    allowOwnerOffCurve
  );
  const account = await connection.getAccountInfo(associatedAddress);
  if (!account) {
    transaction.add(
      splToken.Token.createAssociatedTokenAccountInstruction(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        mint,
        associatedAddress,
        owner,
        payer
      )
    );
  }
  return associatedAddress;
}
