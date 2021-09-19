const jwt = require('jsonwebtoken');
const Viewer = require('../models/Viewer');

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authentication) {
    token = req.headers.authentication;
  }

  if (!token) {
    return next(
      res.status(401).json({
        success: false,
        msg: error.message,
      })
    );
  }

  try {
    //Verify token
    const secret = Buffer.from(process.env.JWT_SECRET, 'base64');

    const decode = jwt.verify(token, secret);

    console.log(`decode`, decode);

    req.user = await Viewer.findById(decode.user_id);

    next();
  } catch (error) {
    return next(
      res.status(401).json({
        success: false,
        msg: error.message,
      })
    );
  }
};

module.exports = authMiddleware;
