const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]; // "Bearer {TOKEN}"

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User has properties: id and email
      req.user = decoded.user;

      if (!req.user) {
        return res
          .status(401)
          .json({ msg: "User not found, authorization denied" });
      }

      next(); // Move to the next middleware or route handler
    } catch (err) {
      console.error("Token verification failed:", err.message);
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ msg: "Token is expired, authorization denied" });
      }
      return res
        .status(401)
        .json({ msg: "Token is not valid, authorization denied" });
    }
  }

  return res.status(401).json({ msg: "No token, authorization denied" });
};

module.exports = { protect };
