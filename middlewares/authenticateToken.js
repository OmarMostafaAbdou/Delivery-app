const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Login required" });
  }

  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.SECRET_KEY || "secret"
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: "Unauthorized: Login required" });
  }
};

module.exports = authenticateToken;
