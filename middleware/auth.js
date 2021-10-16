const jwt = require('jsonwebtoken');
const Viewer = require('../models/Viewer');

const authMiddleware = async (req, res, next) => {
  let token;
  console.log(`req`, req.headers);
  if (req.headers.authorization) {
    token = req.headers.authorization;
  }
  console.log(`token`, token);
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
    // Leave the console.log for testing purpose
    // console.log(`process.env.JWT_SECRET`, process.env.JWT_SECRET);

    const secret = Buffer.from(process.env.JWT_SECRET, 'base64');

    console.log(`secret`, secret);

    const decode = jwt.verify(token, secret);

    console.log(`decode`, decode);

    req.user = await Viewer.findOne({ viewerId: decode.user_id });
    console.log(`req.user`, req.user);
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
