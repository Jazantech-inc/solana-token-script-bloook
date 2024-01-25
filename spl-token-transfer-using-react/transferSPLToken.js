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
    PublicKey,
    TransactionInstruction,
    Transaction,
  } from "@solana/web3.js";
  const [walletAddress, setWalletAddress] = useState(null);
    const getProvider = () => {
      const prodramId = new PublicKey(idl.metadata.address);
      const network = clusterApiUrl("devnet");
      const opts = { preflightCommitment: "processed" };
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = new AnchorProvider(
        connection,
        window.solana,
        opts.preflightCommitment
      );
      const program = new Program(idl, prodramId, provider);
      return { connection, provider, program };
    };
    const checkIfWalletIsConnected = async () => {
      try {
        const { solana } = window;
        if (solana) {
          if (solana.isPhantom) {
            console.log("=====> Phantom Wallet found.");
            const response = await solana.connect({ onlyIfTrusted: true });
            console.log(
              "=====> Connect with Publickey: ",
              response.publicKey.toString()
            );
            setWalletAddress(response.publicKey.toString());
          } else {
            alert("Solana object notfound, please install phantom wallet.");
          }
        }
      } catch (error) {
        console.error("===> Error", error);
      }
    };
    const connectToWallet = async () => {
      const { solana } = window;
      if (solana) {
        const responce = await solana.connect();
        console.log(
          "=====> connect with publickey: ",
          responce.publicKey.toString()
        );
        setWalletAddress(responce.publicKey.toString());
      }
    };


const transferSplToken = async () => {
    console.log("Called transfer SPL token");
    const { connection, provider } = getProvider();
    const mintToken = new PublicKey(
      "5BHUUPKtRQUrPXkDPPdviy8NTJ2QL1UTnhWTVX6ovtKi"
    ); // SPL Token Address
    const associatedTokenFrom = await getAssociatedTokenAddress(
      mintToken,
      provider.wallet.publicKey
    );
    const recipientAddressArray = [];
    recipientAddressArray.push(
      new PublicKey("A8ZXQAR4YarHyYTXfwqCJRYghiHc39j6U6x2HpnFgUP8")
    );
    recipientAddressArray.push(
      new PublicKey("9ouBeUK4nw1hRBMgcwAoYxe8SR5B5ZcgwMENQHLqmuqd")
    );
    const transactionInstructions = [];
    for (let recipientAddress of recipientAddressArray) {
      const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        recipientAddress
      );
      if (!(await connection.getAccountInfo(associatedTokenTo))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
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
          provider.wallet.publicKey,
          1000000 // transfer 1 USDC, USDC on solana devnet has 6 decimal
        )
      );
      console.log("associatedTokenFrom: ", associatedTokenFrom.toBase58());
      console.log("associatedTokenTo: ", associatedTokenTo.toBase58());
    }
    const transaction = new Transaction().add(...transactionInstructions);
    transaction.feePayer = provider.wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    const { signature } = await provider.wallet.signAndSendTransaction(
      transaction
    );
    await connection.getSignatureStatus(signature);
    console.log("provider: ", provider);
    console.log("signature: ", signature);
  };