const  { createMint , getMint ,getOrCreateAssociatedTokenAccount,getAccount,mintTo,transfer,burn} = require('@solana/spl-token');
const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL ,PublicKey, TransactionSignature} =  require('@solana/web3.js');
const base58 = require('bs58');

const payer = Keypair.fromSecretKey(base58.decode("5cozvavrV7t9SyNnfbdsAVHJFHr9KUt6xgPzejMfLsXWqGY9DAH3Eh9qjVp847vfKw2MkiwYxnGzRKkw6yd8FcgJ"))
const mintAuthority = payer
const freezeAuthority = payer

//connection with solana
const connection = new Connection(
  clusterApiUrl('testnet'),
  'confirmed'
);


//Token Minting Account Address
const mint = new PublicKey("23PfyriUFSzgvuFNu4N6ZVZuWxcpmP6xgsQisLx5M7T2");
//token address
const tokenAccount = new PublicKey("7afY39hBCH3tMbea7wrPjzWeYiLQRb2JuBSD9NqKeZe2");

//wallet addresses
const recieverAccount = new PublicKey("D7Y6guxJZcHsVwDUY59kytkkYfnJfjZbsef7R4XB6Ggw"); //account 1
const devteamAddress = new PublicKey("F7okzA3p7sAR1DyVoKxKcU1meAfFmxpY5LGPZnsCnYih");  //account 2
const stakeholders = new PublicKey("ECE3cn9feo365mBaZe5feseDWUjAACJu7ru9H27g29f2");  //account 3
const charity = new PublicKey("GCe1hY4paHTAaSEXLbydfwjgTxSC5a8rApUt7jQ1e6hQ"); //Account 4

const addresses = {recieverAccount,devteamAddress,stakeholders,charity};

//Create Token
const CreateToken = async ()=> {
    const mint = await createMint(
        connection,
        payer,
        mintAuthority.publicKey,
        freezeAuthority.publicKey,
        9 // We are using 9 to match the CLI decimal default exactly
      );
      console.log(mint.toBase58());      // CUA9XgyvtnhDWvjNEvGxZVFL34zH3etLWzSpj3QVhLHd
}

//get Token Supply
const TokenSupply = async () => {
    const mint = new PublicKey("23PfyriUFSzgvuFNu4N6ZVZuWxcpmP6xgsQisLx5M7T2");
    // console.log("Mint result : ",mint)
    const mintInfo = await getMint(
        connection,
        mint
      )      
      console.log(mintInfo.supply)
    
}

//create Associated account
const CreateAssociatedAccount = async (connection,payer,mint) => {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
      )
      console.log(tokenAccount.mint.toBase58());
      console.log(tokenAccount.owner.toBase58());
      console.log(tokenAccount.address.toBase58());
}
//Get Account Info
const GetAccountInfo = async (connection,tokenAccount) => {
  const tokenAccountInfo = await getAccount(
    connection,
    tokenAccount
  )
  
  console.log(tokenAccountInfo.amount);
}

//mint_Tokens
const mintTokens = async (connection, payer,mint,tokenAccount,amount) => {
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer.publicKey,
    amount
  )
}

//send Tokens to Other address
const transferTokens = async (connection,payer,tokenAccount,recieverAccount,amount) => {
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint,recieverAccount);
  signature = await transfer(
    connection,
    payer,
    tokenAccount,
    toTokenAccount.address,
    payer.publicKey,
    amount,
);
}

//mint and distribute to different people


const BurnTokens = async (connection,payer,tokenAccount,mint,amount) => {
 result = await burn(connection,
  payer,
  tokenAccount,
  mint,
  payer.publicKey,
  amount)
  console.log("result : ",result);
}

const mintAndTransfer  = async (connection,payer,mint,tokenAccount,amount,addresses) => {

  console.log("inside function");
  let mintTxt = await mintTokens(connection, payer,mint,tokenAccount,amount);
  console.log(mintTxt);
  amount = amount / 4;

  //Token Distribution 
  charityPercentage = 3;
  devTeamPercentage = 10;
  stakeHolderPercentage =  2;

  // for(const address in addresses){
    console.log("checking : ",typeof(address));
   let txt = await transferTokens(connection,payer,tokenAccount,recieverAccount,amount);  
    console.log("hash of Transactions : ",);
     txt = await transferTokens(connection,payer,tokenAccount,charity,amount);  
    console.log("hash of Transactions : ",);
     txt = await transferTokens(connection,payer,tokenAccount,devteamAddress,amount);  
    console.log("hash of Transactions : ",);
     txt = await transferTokens(connection,payer,tokenAccount,stakeholders,amount);  
    console.log("hash of Transactions : ",);
  // }
}

// CreateAssociatedAccount(connection,payer,mint);
// console.log(tokenAccount.address);
// GetAccountInfo(connection,tokenAccount);
// mintTokens(connection, payer, mint , tokenAccount, 10e9);
transferTokens(connection,payer,tokenAccount,recieverAccount,10);
// BurnTokens(connection,payer,tokenAccount,mint,1e9);
// mintAndTransfer(connection,payer,mint,tokenAccount,1e9,addresses);
// console.log(typeof(charity));
