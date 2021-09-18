const jwt = require('jsonwebtoken');
const Viewer = require('../models/Viewer');

const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startWith('Bearer')
  ) {
    token = req.headers.authorization;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorize to access this route'), 401);
  }

  try {
    //Verify token
    const secret = Buffer.from(process.env.JWT_SECRET, 'base64');
    const decode = jwt.verify(token, secret);

    console.log(`decode`, decode);

    req.user = await Viewer.findById(decode.user_id);

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorize to access this route'), 401);
  }
};

module.exports = authMiddleware;
