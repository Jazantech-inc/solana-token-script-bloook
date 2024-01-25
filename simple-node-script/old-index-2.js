const  { createMint , getMint ,getOrCreateAssociatedTokenAccount,getAccount,mintTo,transfer,burn} = require('@solana/spl-token');
const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL ,PublicKey, TransactionSignature} =  require('@solana/web3.js');
const base58 = require('bs58');
const fs = require('fs');


// get kepair from json file
const get_kaypair_from_json = (file_path) => {
  const u8_array = JSON.parse(fs.readFileSync(file_path))
  return Keypair.fromSeed(Uint8Array.from(u8_array.slice(0,32)));
}

// // get kepair from account key
const get_kaypair_from_key = (key) => { 
  return Keypair.fromSecretKey(base58.decode(key))
 }

//9mkZPFisGaJW7mcd3GybGHwTn21XaMjTihjAK7MDACXX
// const payer = get_kaypair_from_json('wallet/my-keypair.json');
const payer = get_kaypair_from_key("2bo7hQRamF331pp5GtzQzfHx3yzQr36FDrYvRJinuJ5zai44YPMvJ6EV6yhamYYYmjcTpAPgZt18pAEvbyu7Nnmj");
const mintAuthority = payer
const freezeAuthority = payer



//connection with solana
const connection = new Connection(
  clusterApiUrl('devnet'),
  'confirmed'
);

// test conneection
(async ()=>{
  console.log(await connection.getBalance(payer.publicKey));

})()

//Token Minting Account Address
const mint = new PublicKey("2PmCJRYKGTakTaY3n5SgQqA5tFWptUQ18WK3VZR1fPch");
//token address after calling "createAssociatedAccount"
const tokenAccount = new PublicKey("BjvDdrysS119JmtoenfV2WUegMXogWJRTJpH4W7Qk41F");

//wallet addresses
const recieverAccount = new PublicKey("5qrUGR4BP7wp3g9TWkL8xHeTAMtQQxEY96RpAyUanwPt"); //account 1
const devteamAccount = new PublicKey("41KZXHc3szQrVCUHwJs4Lmi6qQu4wkUqYY66UpiWeunB");  //account 2
const stakeholdersAccount = new PublicKey("7sSLC9SxjsK1w2X8tpFxTVi15XfVxvunRJYYRJut2PJg");  //account 3
const charityAccount = new PublicKey("DSZ3B5u2NxfatHGwPH5DcFLf6XZY3PgP5chEndeCPbdf"); //Account 4
const liquidityPoolAccount = new PublicKey("GRBCdAmdRNH1r18patifLcbTSFxd1wLw2m79bL7Jc3CG"); //Account 5

const addresses = {recieverAccount, devteamAccount, stakeholdersAccount, charityAccount, liquidityPoolAccount};

//Create Token (give mint address)
const createToken = async ()=> {
    const mint = await createMint(
        connection,
        payer,
        mintAuthority.publicKey,
        freezeAuthority.publicKey,
        9, // We are using 9 to match the CLI decimal default exactly
        await get_kaypair_from_json('wallet/mint.json')
      );
      console.log(mint.toBase58());      // print mint address
}

//get Token Supply
const tokenSupply = async () => {
    // console.log("Mint result : ",mint)
    const mintInfo = await getMint(
        connection,
        mint
      )      
      console.log(mintInfo.supply)
    
}


//create Token Associated account
const createAssociatedAccount = async (owner) => {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner
      )
      console.log("Mint Address:", tokenAccount.mint.toBase58());
      console.log("Owner Address: ", tokenAccount.owner.toBase58());
      console.log("Token Account:", tokenAccount.address.toBase58());
      return tokenAccount.address;
}
//Get Account Info
const getAccountInfo = async (tokenAccount) => {
  const tokenAccountInfo = await getAccount(
    connection,
    tokenAccount
  )
  
  console.log(tokenAccountInfo.amount);
}


//mint_tokens in token associated account
const mintTokens = async (tokenAccount,amount) => {
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer.publicKey,
    amount
  )
}

// burn_tokens
const burnTokens = async (tokenAccount,amount) => {
  result = await burn(connection,
   payer,
   tokenAccount,
   mint,
   payer.publicKey,
   amount)
   console.log("result : ",result);
 }




//send Tokens to Other address
const transferTokens = async (signer, senderTokenAccount, recieverAccount, amount) => {
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recieverAccount);
  console.log("Associated Token Account: ", toTokenAccount.address.toBase58());
  signature = await transfer(
    connection,
    signer,
    senderTokenAccount,
    toTokenAccount.address,
    signer.publicKey,
    amount,
  );
    return signature;
}

//mint and distribute to different people
const tokenSendAndDistribute  = async (tokenAccount, amount, addresses) => {

  //Token Distribution 
  forCharity = 1 * amount / 100; // 10 out of 1000
  forDevTeam = 2 * amount / 100; // 20 out of 1000
  forStakeHolder =  3 * amount / 100; // 30 out of 1000
  forLiquidityPool = 10 * amount / 100; // 100 out of 1000
  forReciever = amount - (forCharity + forDevTeam + forStakeHolder + forLiquidityPool); //850 out of 1000

  
   let txt = await transferTokens(payer, tokenAccount, addresses.recieverAccount, forReciever);  
    console.log("recieverAccount transactions : ", txt);
     txt = await transferTokens(payer, tokenAccount, addresses.charityAccount, forCharity);  
    console.log("charityAddress transactions : ", txt);
     txt = await transferTokens(payer, tokenAccount, addresses.devteamAccount, forDevTeam);  
    console.log("devteamAddress transactions : ", txt);
     txt = await transferTokens(payer, tokenAccount, addresses.stakeholdersAccount, forStakeHolder);  
    console.log("stakeholdersAddress transactions : ", txt);
    txt = await transferTokens(payer, tokenAccount, addresses.liquidityPoolAccount, forLiquidityPool);  
    console.log("stakeholdersAddress transactions : ", txt);

    const send_tokens = getAccountInfo(await createAssociatedAccount(addresses.recieverAccount));
    console.log("send token to reciever : ", send_tokens);

}


// get all accounts token status
// send token back
const getALlAccountsTokenStatus = async () => {
  // await transferTokens( get_kaypair_from_json('wallet/recieverAccount.json'),
  //   await createAssociatedAccount(addresses.recieverAccount), 
  //   payer.publicKey, 940);

  // await transferTokens( get_kaypair_from_json('wallet/charityAccount.json'),
  //   await createAssociatedAccount(addresses.charityAccount), 
  //   payer.publicKey, 10);

  // await transferTokens( get_kaypair_from_json('wallet/devteamAccount.json'),
  //   await createAssociatedAccount(addresses.devteamAccount), 
  //   payer.publicKey, 20);

  // await transferTokens( get_kaypair_from_json('wallet/stakeholdersAccount.json'),
  //   await createAssociatedAccount(addresses.stakeholdersAccount), 
  //   payer.publicKey, 30);

  // await transferTokens( get_kaypair_from_json('wallet/liquidityPoolAccount.json'),
  //   await createAssociatedAccount(addresses.liquidityPoolAccount), 
  //   payer.publicKey, 100);


  await getAccountInfo(await createAssociatedAccount(payer.publicKey));
  await getAccountInfo(await createAssociatedAccount(addresses.recieverAccount));
  await getAccountInfo(await createAssociatedAccount(addresses.charityAccount));
  await getAccountInfo(await createAssociatedAccount(addresses.devteamAccount));
  await getAccountInfo(await createAssociatedAccount(addresses.stakeholdersAccount));
  await getAccountInfo(await createAssociatedAccount(addresses.liquidityPoolAccount));
}


(async () => {
  // createToken();
  // tokenSupply();
  // createAssociatedAccount(payer.publicKey);
  // getAccountInfo(tokenAccount);
  // mintTokens(tokenAccount, 10e9);
  // burnTokens(tokenAccount, 1e9);

  // addresses.recieverAccount = recieverAccount;
  // await tokenSendAndDistribute(tokenAccount, 1000, addresses);
  await getALlAccountsTokenStatus();
})();







