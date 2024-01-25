# SolanaToken

`simple-node-script` have just simple node script in which we implement the solene spl token functionality.

`node-api` have the same script but it's run as api and all methods can run as api.

`spl-token-transfer-using-react` have the code for connecting to phantom wallet and send and assign transaction for transfer spl tokens.

#### Note:
For token Distribution we multiply the amount 1000000000 because token have 9 decimal places. <br>
And transfer method get int64 as amount and 1000000000 amount is equal to 1 token. <br>
When we Distribute token according to the percentage then we can get the float value so we use `Math.floor()` method for truncate <br>

