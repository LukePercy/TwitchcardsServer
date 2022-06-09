const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Viewer = require("../models/Viewer");
// Load env vars
dotenv.config({ path: "./config/config.env" });

const bearerPrefix = "Bearer ";
const key = process.env.JWT_SECRET;

const secret = Buffer.from(key, "base64");

const verifyTokenAndDecode = (header) => {
  if (header.startsWith(bearerPrefix)) {
    try {
      const token = header.substring(bearerPrefix.length);
      return jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch (error) {
      console.log("error in verfiy token >>>", error);
      throw new Error("Invalid Token");
    }
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const payload = verifyTokenAndDecode(req.headers.authorization);
    req.user = await Viewer.findOne({ viewerId: payload.user_id });

    next();
  } catch (error) {
    console.log(`error`, error);
    return next(
      res.status(401).json({
        success: false,
        msg: error.message,
      })
    );
  }
};

module.exports = authMiddleware;
