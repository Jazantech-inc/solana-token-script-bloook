const {
    createMint,
    getMint,
    getOrCreateAssociatedTokenAccount,
    getAccount,
    mintTo,
    transfer,
    burn,
  } = require("@solana/spl-token");
  const {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
  } = require("@solana/web3.js");
  const base58 = require("bs58");
  
  const payer = Keypair.fromSecretKey(
    base58.decode(
      "5cozvavrV7t9SyNnfbdsAVHJFHr9KUt6xgPzejMfLsXWqGY9DAH3Eh9qjVp847vfKw2MkiwYxnGzRKkw6yd8FcgJ"
    )
  );
  const mintAuthority = payer;
  const freezeAuthority = payer;
  
  //connection with solana
  const connection = new Connection(clusterApiUrl("testnet"), "confirmed");
  
  //token address
  const mint = new PublicKey("23PfyriUFSzgvuFNu4N6ZVZuWxcpmP6xgsQisLx5M7T2");
  const tokenAccount = new PublicKey(
    "7afY39hBCH3tMbea7wrPjzWeYiLQRb2JuBSD9NqKeZe2"
  );
  
  //wallet addresses
  const recieverAccount = new PublicKey(
    "C18Ge5g6oeCZHJEJ1VL6AoKhZQpVV5CE8scVELTyqZxt"
  );
  const devteamAddress = new PublicKey(
    "rfiRWnfrKsZRzpE8LybsTizS1jFLxFAb5sa69G3E7mB"
  );
  const stakeholders = new PublicKey(
    "HCZ2aQMXC5U1U5RF4Lj9CHcm9mx4k4cTq3Y61kfkhLUc"
  );
  const charity = new PublicKey("BKtR1eFEvqAcKZEy1CPnFT1AqVrpkMVcFu45et5bnhVo");
  
  const addresses = { recieverAccount, devteamAddress, stakeholders, charity };
  
  //Create Token
  const CreateToken = async () => {
    const mint = await createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      9 // We are using 9 to match the CLI decimal default exactly
    );
    console.log(mint.toBase58()); // CUA9XgyvtnhDWvjNEvGxZVFL34zH3etLWzSpj3QVhLHd
  };
  
  //get Token Supply
  const TokenSupply = async () => {
    const mint = new PublicKey("23PfyriUFSzgvuFNu4N6ZVZuWxcpmP6xgsQisLx5M7T2");
    // console.log("Mint result : ",mint)
    const mintInfo = await getMint(connection, mint);
    const total = mintInfo.supply;
    console.log(parseInt(total) / 10e7);
    return parseInt(total) / 10e7;
  };
  
  //create Associated account
  const CreateAssociatedAccount = async (connection, payer, mint) => {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
    console.log(tokenAccount.mint.toBase58());
    console.log(tokenAccount.owner.toBase58());
    console.log(tokenAccount.address.toBase58());
  };
  //Get Account Info
  const GetAccountInfo = async (connection, tokenAccount) => {
    const tokenAccountInfo = await getAccount(connection, tokenAccount);
  
    console.log(tokenAccountInfo.amount);
  };
  
  //mint_Tokens
  const mintTokens = async (connection, payer, mint, tokenAccount, amount) => {
    return await mintTo(
      connection,
      payer,
      mint,
      tokenAccount,
      payer.publicKey,
      amount
    );
  };
  
  //send Tokens to Other address
  const transferTokens = async (
    connection,
    payer,
    tokenAccount,
    recieverAccount,
    amount
  ) => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      recieverAccount
    );
    signature = await transfer(
      connection,
      payer,
      tokenAccount,
      toTokenAccount.address,
      payer.publicKey,
      amount
    );
    return signature;
  };
  
  //mint and distribute to different people
  
  const BurnTokens = async (connection, payer, tokenAccount, mint, amount) => {
    const result = await burn(
      connection,
      payer,
      tokenAccount,
      mint,
      payer.publicKey,
      amount
    );
    console.log("result : ", result);
    return result;
  };
  
  const mintAndTransfer = async (
    connection,
    payer,
    mint,
    tokenAccount,
    amount,
    addresses
  ) => {
    const data = {};
  
    let mintTxt = await mintTokens(connection, payer, mint, tokenAccount, amount);
    console.log(mintTxt);
    amount = amount / 4;
    data["mintHash"] = `https://solscan.io/tx/${mintTxt}?cluster=testnet`;
  
    let txt = await transferTokens(
      connection,
      payer,
      tokenAccount,
      recieverAccount,
      amount
    );
    data["receiverHash"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
  
    txt = await transferTokens(connection, payer, tokenAccount, charity, amount);
    data["senderHash"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
  
    txt = await transferTokens(
      connection,
      payer,
      tokenAccount,
      devteamAddress,
      amount
    );
    data["devTeamHash"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
  
    txt = await transferTokens(
      connection,
      payer,
      tokenAccount,
      stakeholders,
      amount
    );
    data["stakeHolderHAsh"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
    return data;
  };
  
  exports.supplyOfToken = async (req, res) => {
    try {
      const _result = await TokenSupply();
      return res.json({
        success: true,
        message: `Available token supply: ${_result}`,
        result: _result,
      });
    } catch (error) {
      return res.json({
        error: error.message,
      });
    }
  };
  
  exports.mintTheTokens = async (req, res) => {
    try {
      const _result = await mintTo(
        connection,
        payer,
        mint,
        tokenAccount,
        payer.publicKey,
        req.body.amount * (LAMPORTS_PER_SOL / 10)
      );
      // await mintTokens(
      //   connection,
      //   payer,
      //   tokenAccount,
      //   mint,
      //   req.body.amount * (LAMPORTS_PER_SOL / 10)
      // );
      return res.json({
        success: true,
        message: "Minting successfull.",
        result: `https://solscan.io/tx/${_result}?cluster=testnet`,
      });
    } catch (error) {
      return res.json({
        error: error.message,
      });
    }
  };
  
  exports.transferTheTokens = async (req, res) => {
    try {
      const receiverAccount = req.body.receiverAccount;
      const amount = req.body.amount * (LAMPORTS_PER_SOL / 10);
  
      const _result = await transferTokens(
        connection,
        payer,
        tokenAccount,
        recieverAccount,
        amount
      );
  
      console.log(`transfer tokens : `, _result);
  
      return res.json({
        success: true,
        message: "Transfer successfull.",
        result: `https://solscan.io/tx/${_result}?cluster=testnet`,
      });
    } catch (error) {
      return res.json({
        error: error.message,
      });
    }
  };
  
  exports.burnTheTokens = async (req, res) => {
    try {
      const _result = await BurnTokens(
        connection,
        payer,
        tokenAccount,
        mint,
        req.body.amount * (LAMPORTS_PER_SOL / 10)
      );
      return res.json({
        success: true,
        message: "Burn successfull.",
        result: `https://solscan.io/tx/${_result}?cluster=testnet`,
      });
    } catch (error) {
      return res.json({
        error: error.message,
      });
    }
  };
  
  exports.mintAndTransferTheTokens = async (req, res) => {
    try {
      const _result = await mintAndTransfer(
        connection,
        payer,
        mint,
        tokenAccount,
        req.body.amount * (LAMPORTS_PER_SOL / 10),
        addresses
      );
      return res.json({
        success: true,
        message: "Minted and transferred successfully.",
        result: _result,
      });
    } catch (error) {
      return res.json({
        error: error.message,
      });
    }
  };
  