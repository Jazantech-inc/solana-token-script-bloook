const { createMint, getMint, getOrCreateAssociatedTokenAccount, getAccount, mintTo, transfer, burn } = require("@solana/spl-token");
const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } = require("@solana/web3.js");
const base58 = require("bs58");



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
  console.log(tokenAccountInfo.amount);
};


//create token associated account (against the mint address and owner will be the payer address)
const CreateAssociatedAccount = async (connection, payer, mint) => {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  console.log("Mint Address:", tokenAccount.mint.toBase58());
  console.log("Owner Address: ", tokenAccount.owner.toBase58());
  console.log("Token Account:", tokenAccount.address.toBase58());
};



//send tokens to other associated account address
// first check that accociated account is exist or otherwise create new associated account
// then transfer the given token ammount
// signer/payer can be other account which hold some tokens and want to send some other address
const transferTokens = async (connection, payer, mint, senderTokenAccount, recieverAccount, amount) => {
  console.log("transferTokens to this address: ", recieverAccount);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recieverAccount);
  console.log("Associated Token Account: ", toTokenAccount.address.toBase58());
  signature = await transfer(connection, payer, senderTokenAccount, toTokenAccount.address, payer.publicKey, amount);
  return signature;
};




//transfer to reciever address and distribute to different people
// first calculate the percentage for each then transfer to each
const tokenSendAndDistribute = async (connection, payer, mint, tokenAccount, amount, addresses) => {
  //Token Distribution
  const forCharity = (1 * amount) / 100; // 10 out of 1000
  const forDevTeam = (2 * amount) / 100; // 20 out of 1000
  const forStakeHolder = (3 * amount) / 100; // 30 out of 1000
  const forLiquidityPool = (10 * amount) / 100; // 100 out of 1000
  const forReciever = amount - (forCharity + forDevTeam + forStakeHolder + forLiquidityPool); //850 out of 1000

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
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.stakeholders, forStakeHolder);
  console.log("\n4: => stakeholdersAddress transactions : ", txt);
  data["stakeHolderHAsh"] = `https://solscan.io/tx/${txt}?cluster=testnet`;
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.liquidityPool, forLiquidityPool);
  console.log("\n5: => liquidityPoolAddress transactions : ", txt);
  data["liquidityPoolHAsh"] = `https://solscan.io/tx/${txt}?cluster=testnet`;

  const send_tokens = await getOrCreateAssociatedTokenAccount(connection, payer, mint, addresses.recieverAccount);
  console.log("\nsend token to reciever : ", send_tokens.address);

  return data;
};


// burn the given amount of tokens
const BurnTokens = async (connection, payer, tokenAccount, mint, amount) => {
  const result = await burn(connection, payer, tokenAccount, mint, payer.publicKey, amount);
  console.log("result : ", result);
  return result;
};

/* ----------------------------------- end internal methord ----------------------------------- */
/* _____________________________________________________________________________________________ */












/* ************************* start web3 config ************************* */



// const payer = Keypair.fromSecretKey(base58.decode("5cozvavrV7t9SyNnfbdsAVHJFHr9KUt6xgPzejMfLsXWqGY9DAH3Eh9qjVp847vfKw2MkiwYxnGzRKkw6yd8FcgJ"));
// const mintAuthority = payer;
// const freezeAuthority = payer;
// console.log("Authority publick key: ", payer.publicKey.toString());

// //connection with solana cluster
// const connection = new Connection(clusterApiUrl("testnet"), "confirmed");

// //token address mint and token associated account
// const mint = new PublicKey("23PfyriUFSzgvuFNu4N6ZVZuWxcpmP6xgsQisLx5M7T2");
// const tokenAccount = new PublicKey("7afY39hBCH3tMbea7wrPjzWeYiLQRb2JuBSD9NqKeZe2");

// //wallet addresses
// const recieverAccount = new PublicKey("C18Ge5g6oeCZHJEJ1VL6AoKhZQpVV5CE8scVELTyqZxt");
// const devteamAddress = new PublicKey("rfiRWnfrKsZRzpE8LybsTizS1jFLxFAb5sa69G3E7mB");
// const stakeholders = new PublicKey("HCZ2aQMXC5U1U5RF4Lj9CHcm9mx4k4cTq3Y61kfkhLUc");
// const charity = new PublicKey("BKtR1eFEvqAcKZEy1CPnFT1AqVrpkMVcFu45et5bnhVo");
// const liquidityPool = new PublicKey("BKtR1eFEvqAcKZEy1CPnFT1AqVrpkMVcFu45et5bnhVo");

// const addresses = { recieverAccount, devteamAddress, stakeholders, charity , liquidityPool};

/*test start*/

const payer = Keypair.fromSecretKey(base58.decode("2bo7hQRamF331pp5GtzQzfHx3yzQr36FDrYvRJinuJ5zai44YPMvJ6EV6yhamYYYmjcTpAPgZt18pAEvbyu7Nnmj"));
const mintAuthority = payer;
const freezeAuthority = payer;
console.log("Authority publick key: ", payer.publicKey.toString());
//connection with solana
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//token address
const mint = new PublicKey("2PmCJRYKGTakTaY3n5SgQqA5tFWptUQ18WK3VZR1fPch");
const tokenAccount = new PublicKey("BjvDdrysS119JmtoenfV2WUegMXogWJRTJpH4W7Qk41F");

//wallet addresses
const recieverAccount = new PublicKey("5qrUGR4BP7wp3g9TWkL8xHeTAMtQQxEY96RpAyUanwPt");
const devteamAddress = new PublicKey("41KZXHc3szQrVCUHwJs4Lmi6qQu4wkUqYY66UpiWeunB");
const stakeholders = new PublicKey("7sSLC9SxjsK1w2X8tpFxTVi15XfVxvunRJYYRJut2PJg");
const charity = new PublicKey("DSZ3B5u2NxfatHGwPH5DcFLf6XZY3PgP5chEndeCPbdf");
const liquidityPool = new PublicKey("GRBCdAmdRNH1r18patifLcbTSFxd1wLw2m79bL7Jc3CG");

const addresses = { recieverAccount, devteamAddress, stakeholders, charity, liquidityPool };

/*test start*/


/* ----------------------------------- end web3 config ----------------------------------- */
/* _____________________________________________________________________________________________ */





/* ************************* start external APIs ************************* */

exports.mintTheTokens = async (req, res) => {
  try {
    const _result = await mintTo(connection, payer, mint, tokenAccount, payer.publicKey, req.body.amount);
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


// simple transfer without any distribution
exports.justTransferTheTokens = async (req, res) => {
  try {
    const receiverAccount = req.body.receiverAccount;
    const amount = req.body.amount;
    const _result = await transferTokens(connection, payer, mint, tokenAccount, recieverAccount, amount);

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



// transfer token to some address and get the fee ammount in token and distribute
exports.transferAndDistributeTheTokens = async (req, res) => {
  try {
    // const _result = await mintAndTransfer(connection, payer, mint, tokenAccount, req.body.amount * (LAMPORTS_PER_SOL / 10), addresses);
    addresses.recieverAccount = new PublicKey(req.body.reciever);
    const _result = await tokenSendAndDistribute(connection, payer, mint, tokenAccount, req.body.amount /* * (LAMPORTS_PER_SOL / 10)*/, addresses);
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




// burn some specific ammount of token from the payer associated account
exports.burnTheTokens = async (req, res) => {
  try {
    const _result = await BurnTokens(connection, payer, tokenAccount, mint, req.body.amount);
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





// vrify solana addresses is valid or not
exports.verifyAddress = async (req, res) => {
  try {
    address = new PublicKey(req.body.address);
    if (!PublicKey.isOnCurve(address)) {
      console.log("Invalid Address 001..!");
      return res.json({
        success: false,
        message: `Invalid Address 001..!`,
        result: false,
      });
    }
  } catch (err) {
    console.log("Invalid Address 002..!");
    return res.json({
      success: false,
      message: err.message,
      result: false,
    });
  }

  try {
    const network = clusterApiUrl("devnet");
    const opts = { preflightCommitment: "processed" };
    const conn = new Connection(network, opts.preflightCommitment);
    if ((await conn.getAccountInfo(address)) === null) {
      console.log("Address does not exist..!");
      return res.json({
        success: false,
        message: `Address does not exist..!`,
        result: false,
      });
    }
    console.log(await conn.getAccountInfo(address));
    return res.json({
      success: true,
      message: `Valid Address..!`,
      result: true,
    });
  } catch (error) {
    console.log("Invalid Address 003..!");
    return res.json({
      success: false,
      message: err.message,
      result: false,
    });
  }
};
/* ----------------------------------- end external APIs ----------------------------------- */
/* _____________________________________________________________________________________________ */








