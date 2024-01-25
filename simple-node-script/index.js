const { createMint, getMint, getOrCreateAssociatedTokenAccount, getAccount, mintTo, transfer,
   burn, getAssociatedTokenAddress} = require("@solana/spl-token");
const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey} = require("@solana/web3.js");
const base58 = require("bs58");
const fs = require("fs");

// get kepair from json file
const get_kaypair_from_json = (file_path) => {
  const u8_array = JSON.parse(fs.readFileSync(file_path));
  return Keypair.fromSeed(Uint8Array.from(u8_array.slice(0, 32)));
};

// get kepair from account key
const get_kaypair_from_key = (key) => {
  return Keypair.fromSecretKey(base58.decode(key));
};

// check float number
function isFloat(n){
  return Number(n) === n && n % 1 !== 0;
}






/* ************************* start web3 config ************************* */

//9mkZPFisGaJW7mcd3GybGHwTn21XaMjTihjAK7MDACXX
// const payer = get_kaypair_from_json('wallet/my-keypair.json');
const payer = get_kaypair_from_key("3BQN4tf8HJzFURwt4EB2RFJuxdtcbgP7iqnZLRq5t9t7fowta79kNzLTHrv31b5GTENrLVPrBfaDjwuwnKLUDYLM");
const mintAuthority = payer;
const freezeAuthority = payer;

//connection with solana
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// test conneection
(async () => {
  console.log("Test Connection --> account: ", payer.publicKey.toBase58(), "\nbalance: ", await connection.getBalance(payer.publicKey));
})();

//Token Minting Account Address
const mint = new PublicKey("9wm4wC6Sk6PSSRTLcULyQiGojzBGWZZyGGi6bwpJEANy");
//token address after calling "getOrCreateAssociatedTokenAccount"
const tokenAccount = new PublicKey("FPXcan6zrc4cGcZR9PH5xoAfDngiN3MhxsXBqMNCXLfu");
const tokenDecimal = 1000000000;

//wallet addresses
const recieverAccount = new PublicKey("5qrUGR4BP7wp3g9TWkL8xHeTAMtQQxEY96RpAyUanwPt"); //account 1
const devteamAccount = new PublicKey("41KZXHc3szQrVCUHwJs4Lmi6qQu4wkUqYY66UpiWeunB"); //account 2
const gasFeeAccount = new PublicKey("7sSLC9SxjsK1w2X8tpFxTVi15XfVxvunRJYYRJut2PJg"); //account 3
const charityAccount = new PublicKey("DSZ3B5u2NxfatHGwPH5DcFLf6XZY3PgP5chEndeCPbdf"); //Account 4
const liquidityPoolAccount = new PublicKey("GRBCdAmdRNH1r18patifLcbTSFxd1wLw2m79bL7Jc3CG"); //Account 5
const addresses = { recieverAccount, devteamAccount, gasFeeAccount, charityAccount, liquidityPoolAccount };

// distribution percentage
const charityPercentage = 1;
const devTeamPercentage = 2;
const gasFeePercentage = 3;
const liquidityPoolPercentage = 10;
const percentage = { charityPercentage,  devTeamPercentage,   gasFeePercentage,   liquidityPoolPercentage}


/* ----------------------------------- end web3 config ----------------------------------- */
/* _____________________________________________________________________________________________ */






/* ************************* start internal methord ************************* */

//create token (give mint address)
//create new token address (mint address)
// run only one time and this will give the mint address
const createToken = async () => {
  const mint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    freezeAuthority.publicKey,
    9, // We are using 9 to match the CLI decimal default exactly
    await get_kaypair_from_json("wallet/mint.json")
  );
  console.log(mint.toBase58()); // print mint address
};


//get token supply
//get total token supply (by mint address)
const tokenSupply = async () => {
  // console.log("Mint result : ",mint)
  const mintInfo = await getMint(connection, mint);
  console.log(mintInfo.supply);
};


//mint_tokens in token associated account
//mint given amount of token to the associated account
const mintTokens = async (connection, payer, mint, tokenAccount, amount) => {
  await mintTo(connection, payer, mint, tokenAccount, payer.publicKey, amount);
};


//Get Account Info
//get token amout of that mint address
const getAccountInfo = async (connection, tokenAccount) => {
  const tokenAccountInfo = await getAccount(connection, tokenAccount);
  const balance = await Number(tokenAccountInfo.amount) / (tokenDecimal);
  console.log(balance);
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
// signer can be other account which hold some tokens and want to send some other address
const transferTokens = async (connection, payer, mint, senderTokenAccount, recieverAccount, amount) => {
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recieverAccount);
  console.log("Associated Token Account: ", toTokenAccount.address.toBase58());
  const decimals = 0;
  const signature = await transfer(connection, payer, senderTokenAccount, toTokenAccount.address, payer.publicKey, amount);
  return signature;
};

//mint and distribute to different people
//transfer to reciever address and distribute to different people
// first calculate the percentage for each then transfer to each
const tokenSendAndDistribute = async (connection, payer, mint, tokenAccount, amount, addresses) => {
  
  if (isFloat(amount)) {
    if (amount.toString().split(".")[1].length > 9) {
      throw new Error('Amount is not Valid.')
    }
  }
  amount = (tokenDecimal) * amount;

  //Token Distribution
  const forCharity = Math.floor((percentage.charityPercentage * amount) / 100); // 10 out of 1000
  const forDevTeam = Math.floor((percentage.devTeamPercentage * amount) / 100); // 20 out of 1000
  const forGasFee = Math.floor((percentage.gasFeePercentage * amount) / 100); // 30 out of 1000
  const forLiquidityPool = Math.floor((percentage.liquidityPoolPercentage * amount) / 100); // 100 out of 1000
  const forReciever = Math.floor(amount - (forCharity + forDevTeam + forGasFee + forLiquidityPool)); //850 out of 1000

  if(isFloat(forCharity) || isFloat(forDevTeam) || isFloat(forGasFee) || isFloat(forLiquidityPool) || isFloat(forReciever)){
    throw new Error('Amount is not Distributeable.')
  }

  let txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.recieverAccount, forReciever);
  console.log("\n1: recieverAccount transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.charityAccount, forCharity);
  console.log("\n2: charityAddress transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.devteamAccount, forDevTeam);
  console.log("\n3: devteamAddress transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.gasFeeAccount, forGasFee);
  console.log("\n4: stakeholdersAddress transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.liquidityPoolAccount, forLiquidityPool);
  console.log("\n5: stakeholdersAddress transactions : ", txt);

  const send_tokens = getAccountInfo(connection, await getAssociatedAccount(mint, addresses.recieverAccount));
  console.log("send token to reciever : ", send_tokens);
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




// burn_tokens
// burn the given amount of tokens
const burnTokens = async (connection, payer, tokenAccount, mint, amount) => {
  result = await burn(connection, payer, tokenAccount, mint, payer.publicKey, amount);
  console.log("result : ", result);
};


/* ----------------------------------- end internal methord ----------------------------------- */
/* _____________________________________________________________________________________________ */










// get all accounts token status
// send token back
const getALlAccountsTokenStatus = async () => {
  // await transferTokens(connection, get_kaypair_from_json('wallet/recieverAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.recieverAccount),
  //   payer.publicKey, (tokenDecimal) * 840);

  // await transferTokens(connection, get_kaypair_from_json('wallet/charityAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.charityAccount),
  //   payer.publicKey, (tokenDecimal) * 10);

  // await transferTokens(connection, get_kaypair_from_json('wallet/devteamAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.devteamAccount),
  //   payer.publicKey, (tokenDecimal) * 20);

  // await transferTokens(connection, get_kaypair_from_json('wallet/gasFeeAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.gasFeeAccount),
  //   payer.publicKey, (tokenDecimal) * 30);

  // await transferTokens(connection, get_kaypair_from_json('wallet/liquidityPoolAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.liquidityPoolAccount),
  //   payer.publicKey, (tokenDecimal) * 100);

  await getAccountInfo(connection, await getAssociatedAccount(mint, payer.publicKey));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.recieverAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.charityAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.devteamAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.gasFeeAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.liquidityPoolAccount));
};

(async () => {
  // createToken();
  // tokenSupply();
  // getAssociatedAccount(mint, mint);
  // getAccountInfo(connection, new PublicKey("DfWmqB5r8EjEf8iMvgFsQM9Foepx5ffGdvGBNS1FaDkk"));
  // verifySolanaAccount(connection, "DfWmqB5r8EjEf8iMvgFsQM9Foepx5ffGdvGBNS1FaDkk");
  // mintTokens(connection, payer, mint, tokenAccount, 10e9);
  // burnTokens(connection, payer, tokenAccount, mint, 1e9);

  // addresses.recieverAccount = recieverAccount;
  // await tokenSendAndDistribute(connection, payer, mint, tokenAccount, 1000, addresses);
  await getALlAccountsTokenStatus();
})();
