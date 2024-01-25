/*
In this file decimal functionality is not implemented
but use getAccociatedAccount method instead of getOrCreateAssociatedTokenAccount
*/


const { createMint, getMint, getOrCreateAssociatedTokenAccount, getAccount, mintTo, transfer, transferChecked, burn, getAssociatedTokenAddress} = require("@solana/spl-token");
const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, TransactionSignature} = require("@solana/web3.js");
const base58 = require("bs58");
const fs = require("fs");

// get kepair from json file
const get_kaypair_from_json = (file_path) => {
  const u8_array = JSON.parse(fs.readFileSync(file_path));
  return Keypair.fromSeed(Uint8Array.from(u8_array.slice(0, 32)));
};

// // get kepair from account key
const get_kaypair_from_key = (key) => {
  return Keypair.fromSecretKey(base58.decode(key));
};




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
  console.log(tokenAccountInfo.amount);
  return tokenAccountInfo.amount
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
  // signature = await transfer(connection, payer, senderTokenAccount, toTokenAccount.address, payer.publicKey, amount);
  signature = await transferChecked(connection, payer, senderTokenAccount, mint, toTokenAccount.address, payer.publicKey, amount, 0);



  // let tx = new Transaction();
  // tx.add(
  //   createTransferCheckedInstruction(
  //     senderTokenAccount, // from
  //     mint, // mint
  //     toTokenAccount.address, // to
  //     payer.publicKey, // from's owner
  //     amount, // amount
  //     0 // decimals
  //   )
  // );
  // console.log(`txhash: ${await connection.sendTransaction(tx, [payer])}`);
  // // return signature;
};

//mint and distribute to different people
//transfer to reciever address and distribute to different people
// first calculate the percentage for each then transfer to each
const tokenSendAndDistribute = async (connection, payer, mint, tokenAccount, amount, addresses) => {
  //Token Distribution
  const forCharity = (1 * amount) / 100; // 10 out of 1000
  const forDevTeam = (2 * amount) / 100; // 20 out of 1000
  const forStakeHolder = (3 * amount) / 100; // 30 out of 1000
  const forLiquidityPool = (10 * amount) / 100; // 100 out of 1000
  const forReciever = amount - (forCharity + forDevTeam + forStakeHolder + forLiquidityPool); //850 out of 1000

  let txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.recieverAccount, forReciever);
  console.log("\n1: recieverAccount transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.charityAccount, forCharity);
  console.log("\n2: charityAddress transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.devteamAccount, forDevTeam);
  console.log("\n3: devteamAddress transactions : ", txt);
  txt = await transferTokens(connection, payer, mint, tokenAccount, addresses.stakeholdersAccount, forStakeHolder);
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



/* ************************* start web3 config ************************* */

//9mkZPFisGaJW7mcd3GybGHwTn21XaMjTihjAK7MDACXX
// const payer = get_kaypair_from_json('wallet/my-keypair.json');
const payer = get_kaypair_from_key("2bo7hQRamF331pp5GtzQzfHx3yzQr36FDrYvRJinuJ5zai44YPMvJ6EV6yhamYYYmjcTpAPgZt18pAEvbyu7Nnmj");
const mintAuthority = payer;
const freezeAuthority = payer;

//connection with solana
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// test conneection
(async () => {
  console.log("Test Connection --> account: ", payer.publicKey.toBase58(), "\nbalance: ", await connection.getBalance(payer.publicKey));
})();

//Token Minting Account Address
const mint = new PublicKey("2PmCJRYKGTakTaY3n5SgQqA5tFWptUQ18WK3VZR1fPch");
//token address after calling "getOrCreateAssociatedTokenAccount"
const tokenAccount = new PublicKey("BjvDdrysS119JmtoenfV2WUegMXogWJRTJpH4W7Qk41F");

//wallet addresses
const recieverAccount = new PublicKey("5qrUGR4BP7wp3g9TWkL8xHeTAMtQQxEY96RpAyUanwPt"); //account 1
const devteamAccount = new PublicKey("41KZXHc3szQrVCUHwJs4Lmi6qQu4wkUqYY66UpiWeunB"); //account 2
const stakeholdersAccount = new PublicKey("7sSLC9SxjsK1w2X8tpFxTVi15XfVxvunRJYYRJut2PJg"); //account 3
const charityAccount = new PublicKey("DSZ3B5u2NxfatHGwPH5DcFLf6XZY3PgP5chEndeCPbdf"); //Account 4
const liquidityPoolAccount = new PublicKey("GRBCdAmdRNH1r18patifLcbTSFxd1wLw2m79bL7Jc3CG"); //Account 5

const addresses = { recieverAccount, devteamAccount, stakeholdersAccount, charityAccount, liquidityPoolAccount };

/* ----------------------------------- end web3 config ----------------------------------- */
/* _____________________________________________________________________________________________ */










// get all accounts token status
// send token back
const getALlAccountsTokenStatus = async () => {
  // await transferTokens(connection, get_kaypair_from_json('wallet/recieverAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.recieverAccount),
  //   payer.publicKey, 800);

  // await transferTokens(connection, get_kaypair_from_json('wallet/charityAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.charityAccount),
  //   payer.publicKey, 10);

  // await transferTokens(connection, get_kaypair_from_json('wallet/devteamAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.devteamAccount),
  //   payer.publicKey, 20);

  // await transferTokens(connection, get_kaypair_from_json('wallet/stakeholdersAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.stakeholdersAccount),
  //   payer.publicKey, 30);

  // await transferTokens(connection, get_kaypair_from_json('wallet/liquidityPoolAccount.json'), mint,
  //   await getAssociatedAccount(mint, addresses.liquidityPoolAccount),
  //   payer.publicKey, 100);

  await getAccountInfo(connection, await getAssociatedAccount(mint, payer.publicKey));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.recieverAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.charityAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.devteamAccount));
  await getAccountInfo(connection, await getAssociatedAccount(mint, addresses.stakeholdersAccount));
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
  await tokenSendAndDistribute(connection, payer, mint, tokenAccount, 1000, addresses);
  // await getALlAccountsTokenStatus();
})();