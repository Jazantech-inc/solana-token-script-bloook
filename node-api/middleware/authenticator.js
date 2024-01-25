exports.authenticator = (req, res, next) => {
  try {
    console.log(
      `req.headers.authorization : `,
      // typeof req.headers.authorization.split(" ")[1]
      process.env.auth
    );
    const _auth = req.headers.authorization.split(" ")[1];
    if (_auth === process.env.auth) {
      console.log(`valid user`);
      next();
    } else {
      return res.json({
        success: false,
        message: "Failed to validate.",
      });
    }
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
};
