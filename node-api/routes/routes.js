const router = require("express").Router();
const controller = require("../index");
const { authenticator } = require("../middleware/authenticator");


// router.post("/mint/tokens", authenticator, controller.mintTheTokens);
// router.post("/burn/tokens", authenticator, controller.burnTheTokens);
// router.get("/token/supply", authenticator, controller.supplyOfToken);
// router.get("/token/balance", authenticator, controller.balanceOfToken);
// router.post("/just/transfer/tokens", authenticator, controller.justTransferTheTokens);
// router.post("/distribute/transfer/tokens", authenticator, controller.transferAndDistributeTheTokens);
// router.get("/verify-address", authenticator, controller.verifyAddress);



router.get("/token/supply", controller.supplyOfToken);
router.get("/token/balance", controller.balanceOfToken);
router.post("/distribute/transfer/tokens", controller.transferAndDistributeTheTokens);
router.get("/verify-address", controller.verifyAddress);



module.exports = router;


