const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { username: decodedToken.username, userId: decodedToken.userId };
    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({ message: "You are not authenticated!" });
  }
};
