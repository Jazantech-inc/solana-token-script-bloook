# SolanaToken


install node packegs using ```yarn install```.
all accounts are available in ```wallet``` folder.
run code using `node index.js`

in ```index.js``` we add token distribution function.

1. create token using ```createToken``` that will give the mint address
2. get token detail using  ```tokenSupply``` this will give the total supplay of that mint address
3. create Associated Account using ```CreateAssociatedAccount``` this will create the associated account for that token
4. create account info using ```GetAccountInfo```
5. mint token using ```mintTokens``` can mint the token of that mint address to the token associated account for any wallet address
6. transfer token using ```transferTokens``` transfer token from a token associated account to other(receiver) token associated account
7. burn token using ```burnTokens``` burn token from a token associated account
8. token send to a receiver account and  distribute tokens to given accounts using ```tokenSendAndDistribute``` itt will create a tokenassociated account if account does not exist and sent tokens to other token associated accounts
9. get the token ststus of all given accounts using```getALlAccountsTokenStatus``` and can resend token to main account
10. get kepair from json file using```get_kaypair_from_json``` this will return the keypair



