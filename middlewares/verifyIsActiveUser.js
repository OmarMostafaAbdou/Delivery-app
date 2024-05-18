const User = require("../models/user.schema");

const verifyIsActiveUser = async (req, res, next) => {
  const { userId } = req.query;

  try {
    let user = await User.findOne({ username: userId });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    console.log(user);
    if (user.isActive) {
      next();
    } else {
      return res.status(404).json({
        status: 404,
        message: "User subscription has expired",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

module.exports = verifyIsActiveUser;
