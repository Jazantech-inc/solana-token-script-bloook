import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  mintTo,
  transfer,
  burn,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
export const TransferSPLTokens: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    const onClick = useCallback(async () => {
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }
    const mintToken = new PublicKey(
      "5BHUUPKtRQUrPXkDPPdviy8NTJ2QL1UTnhWTVX6ovtKi"
    ); // SPL Token Address
    const associatedTokenFrom = await getAssociatedTokenAddress(
      mintToken,
      publicKey
    );
    const recipientAddressArray = [];
    recipientAddressArray.push(
      new PublicKey("A8ZXQAR4YarHyYTXfwqCJRYghiHc39j6U6x2HpnFgUP8")
    );
    recipientAddressArray.push(
      new PublicKey("9ouBeUK4nw1hRBMgcwAoYxe8SR5B5ZcgwMENQHLqmuqd")
    );
    const transactionInstructions = [];
    const tokenAmount = Math.floor(2000000000 / recipientAddressArray.length);
    for (let recipientAddress of recipientAddressArray) {
      const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        recipientAddress
      );
      if (!(await connection.getAccountInfo(associatedTokenTo))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenTo,
            recipientAddress,
            mintToken
          )
        );
      }
      const fromAccount = await getAccount(connection, associatedTokenFrom);
      transactionInstructions.push(
        createTransferInstruction(
          fromAccount.address, // source
          associatedTokenTo, // dest
          publicKey,
          tokenAmount // 6 decimal
        )
      );
      console.log("associatedTokenFrom: ", associatedTokenFrom.toBase58());
      console.log("associatedTokenTo: ", associatedTokenTo.toBase58());
    }
        let signature: TransactionSignature = '';
        try {
            const transaction = new Transaction().add(...transactionInstructions);
            signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, getUserSOLBalance]);
    return (
        <div>
            <button
                className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick}
            >
                <span>Transfer</span>
            </button>
        </div>
    );
};