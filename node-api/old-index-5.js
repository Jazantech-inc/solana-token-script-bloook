const { createMint, getMint, getOrCreateAssociatedTokenAccount, getAccount, mintTo, transfer,
    burn, getAssociatedTokenAddress} = require("@solana/spl-token");
  const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey} = require("@solana/web3.js");
  const base58 = require("bs58");
  require("dotenv").config();
  
  // check float number
  function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
  }
  
  
  
  /* ************************* start web3 config ************************* */
  
  // user key
  const payer = Keypair.fromSecretKey(base58.decode(process.env.KEY));
  const mintAuthority = payer;
  const freezeAuthority = payer;
  console.log("Authority publick key: ", payer.publicKey.toString());
  //connection with solana
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  //token address
  const mint = new PublicKey("9wm4wC6Sk6PSSRTLcULyQiGojzBGWZZyGGi6bwpJEANy");
  const tokenAccount = new PublicKey("FPXcan6zrc4cGcZR9PH5xoAfDngiN3MhxsXBqMNCXLfu");
  
  //wallet addresses
  const recieverAccount = new PublicKey("5qrUGR4BP7wp3g9TWkL8xHeTAMtQQxEY96RpAyUanwPt");
  const devteamAddress = new PublicKey("41KZXHc3szQrVCUHwJs4Lmi6qQu4wkUqYY66UpiWeunB");
  const gasFeeAddress = new PublicKey("7sSLC9SxjsK1w2X8tpFxTVi15XfVxvunRJYYRJut2PJg");
  const charity = new PublicKey("DSZ3B5u2NxfatHGwPH5DcFLf6XZY3PgP5chEndeCPbdf");
  const liquidityPool = new PublicKey("GRBCdAmdRNH1r18patifLcbTSFxd1wLw2m79bL7Jc3CG");
  
  const addresses = { recieverAccount, devteamAddress, gasFeeAddress, charity, liquidityPool };
  
  
  // distribution percentage
  const charityPercentage = 1;
  const devTeamPercentage = 2;
  const gasFeePercentage = 3;
  const liquidityPoolPercentage = 10;
  const percentage = { charityPercentage,  devTeamPercentage,   gasFeePercentage,   liquidityPoolPercentage}
  
  
  
  /* ----------------------------------- end web3 config ----------------------------------- */
  /* _____________________________________________________________________________________________ */
  
  
  
  
  
  /* ************************* start internal methord ************************* */
  
  //create new token address (mint address)
  // run only one time and this will give the mint address
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
  
  
  //get total token supply (by mint address)
  const TokenSupply = async () => {
    const mintInfo = await getMint(connection, mint);
    const total = mintInfo.supply;
    console.log(parseInt(total));
    return parseInt(total);
  };
  
  //mint given amount of token to the associated account
  const mintTokens = async (connection, payer, mint, tokenAccount, amount) => {
    return await mintTo(connection, payer, mint, tokenAccount, payer.publicKey, amount);
  };
  
  
  //get token amout of that mint address
  const GetAccountInfo = async (connection, tokenAccount) => {
    const tokenAccountInfo = await getAccount(connection, tokenAccount);
    const balance = await Number(tokenAccountInfo.amount) / (1000000000);
    return balance;
  };
  
  
  //get Token Associated account
  //get token associated account (against the mint address and owner will be the payer address)
  const getAssociatedAccount = async (mint, owner) => {
    const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner);
    console.log("Token Account Address:", tokenAccountAddress.toBase58());
    return tokenAccountAddress;
  };
  
  
  
  //send tokens to other associated account address
  // first check that accociated account is exist or otherwise create new associated account
  // then transfer the given token ammount
  // signer/payer can be other account which hold some tokens and want to send some other address
  const transferTokens = async (connection, payer, mint, senderTokenAccount, recieverAccount, amount) => {
    console.log("TransferTokens to this address: ", recieverAccount.toBase58());
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recieverAccount);
    console.log("Associated Token Account: ", toTokenAccount.address.toBase58());
    signature = await transfer(connection, payer, senderTokenAccount, toTokenAccount.address, payer.publicKey, amount);
    return signature;
  };
  
  
  
  
  //transfer to reciever address and distribute to different people
  // first calculate the percentage for each then transfer to each
  const tokenSendAndDistribute = async (connection, payer, mint, tokenAccount, amount, addresses) => {
    if (isFloat(amount)) {
      if (amount.toString().split(".")[1].length > 9) {
        throw new Error('Amount is not Valid.')
      }
    }
    amount = (1000000000) * amount;
  
    //Token Distribution
    const forCharity = Math.floor((percentage.charityPercentage * amount) / 100); // 10 out of 1000
    const forDevTeam = Math.floor((percentage.devTeamPercentage * amount) / 100); // 20 out of 1000
    const forGasFee = Math.floor((percentage.gasFeePercentage * amount) / 100); // 30 out of 1000
    const forLiquidityPool = Math.floor((percentage.liquidityPoolPercentage * amount) / 100); // 100 out of 1000
    const forReciever = Math.floor(amount - (forCharity + forDevTeam + forGasFee + forLiquidityPool)); //850 out of 1000
  
    if(isFloat(forCharity) || isFloat(forDevTeam) || isFloat(forGasFee) || isFloat(forLiquidityPool) || isFloat(forReciever)){
      throw new Error('Amount is not Distributeable.')
    }
  
    const data = {};
    
    let txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.recieverAccount, forReciever);
    console.log("\n1: => recieverAccount transactions : ", txt);
    data["receiverHash"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
    txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.charity, forCharity);
    console.log("\n2: => charityAddress transactions : ", txt);
    data["charityHash"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
    txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.devteamAddress, forDevTeam);
    console.log("\n3: => devteamAddress transactions : ", txt);
    data["devTeamHash"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
    txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.gasFeeAddress, forGasFee);
    console.log("\n4: => gasFeeAddress transactions : ", txt);
    data["stakeHolderHAsh"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
    txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.liquidityPool, forLiquidityPool);
    console.log("\n5: => liquidityPoolAddress transactions : ", txt);
    data["liquidityPoolHAsh"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
  
    const send_tokens = await getOrCreateAssociatedTokenAccount(connection, payer, mint, addresses.recieverAccount);
    console.log("\nsend token to reciever : ", send_tokens.address);
  
    return data;
  };
  
  
  
  // vrify solana addresses is valid or not
  const verifySolanaAccount = async (connection, address) => {
    let message = "";
    try {
      address = new PublicKey(address);
      if (!PublicKey.isOnCurve(address)) {
        message = "Invalid Address 001..!";
        console.log(message);
        return {_result: true, _message: message};
      }
    } catch (err) {
      message= "Invalid Address 002..!";
      console.log(message);
      return {_result: false, _message: message};
    }
  
    try {
      if ((await connection.getAccountInfo(address)) === null) {
        message = "Address does not exist..!";
        console.log(message);
        return {_result: false, _message: message};
      }
      console.log(await connection.getAccountInfo(address));
      message = "Address is Valid.";
      console.log(message);
      return {_result: true, _message: message};
    } catch (error) {
      message = "Invalid Address 003..!";
      console.log(message, "\nError: ", error);
      return {_result: false, _message: message};
    }
  };
  
  
  
  // burn the given amount of tokens
  const BurnTokens = async (connection, payer, tokenAccount, mint, amount) => {
    const result = await burn(connection, payer, tokenAccount, mint, payer.publicKey, amount);
    console.log("result : ", result);
    return result;
  };
  
  /* ----------------------------------- end internal methord ----------------------------------- */
  /* _____________________________________________________________________________________________ */
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  /* ************************* start external APIs ************************* */
  
  // exports.mintTheTokens = async (req, res) => {
  //   try {
  //     const _result = await mintTo(connection, payer, mint, tokenAccount, payer.publicKey, req.body.amount);
  //     // await mintTokens(
  //     //   connection,
  //     //   payer,
  //     //   tokenAccount,
  //     //   mint,
  //     //   req.body.amount * (LAMPORTS_PER_SOL / 10)
  //     // );
  //     return res.json({
  //       success: true,
  //       message: "Minting successfull.",
  //       result: `https://solscan.io/tx/${_result}?cluster=testnet`,
  //     });
  //   } catch (error) {
  //     return res.json({
  //       success: false,
  //       error: error.message,
  //     });
  //   }
  // };
  
  
  
  
  
  // // burn some specific ammount of token from the payer associated account
  // exports.burnTheTokens = async (req, res) => {
  //   try {
  //     const _result = await BurnTokens(connection, payer, tokenAccount, mint, req.body.amount);
  //     return res.json({
  //       success: true,
  //       message: "Burn successfull.",
  //       result: `https://solscan.io/tx/${_result}?cluster=testnet`,
  //     });
  //   } catch (error) {
  //     return res.json({
  //       success: false,
  //       error: error.message,
  //     });
  //   }
  // };
  
  
  
  // find the total supply of that mint address
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
        success: false,
        error: error.message,
      });
    }
  };
  
  
  
  
  // find the token balance for given address
  // first find the associated token account
  // then find the balance of thet associated token account hold
  exports.balanceOfToken = async (req, res) => {
    try {
      const address = new PublicKey(req.body.address)
      const associatedAccount = await getAssociatedAccount(mint, address);
      let {_result, _message} = await verifySolanaAccount(connection, associatedAccount.toBase58());
      console.log("_result: ", _result, "_message: ", _message);
      if (_result === false || _result === undefined) {
        _result = false;
        _message = "Account not found.";
        return res.json({
          success: _result,
          message: `${_message}`,
          result: _result,
        });
      }
      _result = (await GetAccountInfo(connection, associatedAccount)).toString();
      return res.json({
        success: true,
        message: `Token balance is: ${_result}`,
        result: _result,
      });
    } catch (error) {
      return res.json({
        success: false,      
        error: error.message,
      });
    }
  };
  
  
  
  
  // // simple transfer without any distribution
  // exports.justTransferTheTokens = async (req, res) => {
  //   try {
  //     const receiverAccount = req.body.receiverAccount;
  //     const amount = req.body.amount;
  //     const _result = await transferTokens(connection, payer, mint, tokenAccount, recieverAccount, amount);
  
  //     console.log(`transfer tokens : `, _result);
  
  //     return res.json({
  //       success: true,
  //       message: "Transfer successfull.",
  //       result: `https://solscan.io/tx/${_result}?cluster=testnet`,
  //     });
  //   } catch (error) {
  //     return res.json({
  //       success: false,  
  //       error: error.message,
  //     });
  //   }
  // };
  
  
  
  
  // transfer token to some address and get the fee ammount in token and distribute
  exports.transferAndDistributeTheTokens = async (req, res) => {
    try {
      // const _result = await mintAndTransfer(connection, payer, mint, tokenAccount, req.body.amount * (LAMPORTS_PER_SOL / 10), addresses);
      addresses.recieverAccount = new PublicKey(req.body.reciever);
      const _result = await tokenSendAndDistribute(connection, payer, mint, tokenAccount, req.body.amount /* * (LAMPORTS_PER_SOL / 10)*/, addresses);
      return res.json({
        success: true,
        message: "Transferred successfully.",
        result: _result,
      });
    } catch (error) {
      return res.json({
        success: false,
        error: error.message,
      });
    }
  };
  
  
  
  
  
  // vrify solana addresses is valid or not
  exports.verifyAddress = async (req, res) => {
    try {
      const {_result, _message} = await verifySolanaAccount(connection, req.body.address)
      return res.json({
        success: _result,
        message: _message,
        result: _result,
      });
    } catch (error) {
      console.log("verifyAddress error.");
      return res.json({
        success: false,
        message: err.message,
        result: false,
      });
    }
  };
  /* ----------------------------------- end external APIs ----------------------------------- */
  /* _____________________________________________________________________________________________ */
  
  
  
  
  
  
  
  
  
  
  
  