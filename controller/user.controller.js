const User = require("../models/user.schema");
const bcrypt = require("bcryptjs");
const { passwordRegex } = require("../constants/index");

exports.getAllUsers = async (req, res, next) => {
  try {
    // Parse query parameters into integers
    const page = parseInt(req.query.page) || 1;
    const pagination = parseInt(req.query.pagination) || 10;

    // Fetch users with pagination
    const users = await User.find()
      .skip((page - 1) * pagination)
      .limit(pagination);

    // Count total users
    const totalUsers = await User.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / pagination);

    // Send response
    return res.status(200).json({
      status: 200,
      message: "Users found successfully",
      data: users,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        lastPage: totalPages, // Assuming last page equals total pages
        totalUsers: totalUsers,
      },
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
};

exports.getUsersByRole = async (req, res, next) => {
  try {
    // Parse query parameters into integers
    const page = parseInt(req.query.page) || 1;
    const pagination = parseInt(req.query.pagination) || 10;

    // Fetch users by role with pagination
    const users = await User.find({ Role: req.params.role })
    //   .skip((page - 1) * pagination)
    //   .limit(pagination);

    // // Count total users with the specified role
    // const totalUsers = await User.countDocuments({ Role: req.params.role });

    // // Calculate total pages
    // const totalPages = Math.ceil(totalUsers / pagination);

    // Send response
    return res.status(200).json({
      status: 200,
      message: "Users found successfully",
      data: users,

    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
};

// Edit user ---------------------
exports.editUser = async (req, res, next) => {
  const { username, email, phone, Role, isActive } = req.body;
  const { id } = req.params;

  try {
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: id } }, // Exclude the current user by ID
        {
          $or: [{ username: username }, { phone: phone }],
        },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          status: 400,
          message: "Email already exists",
        });
      } else if (existingUser.phone === phone) {
        return res.status(400).json({
          status: 400,
          message: "Phone already exists",
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: "Username already exists",
        });
      }
    }

    let user;
    if (Role == "pilot") {
      const updatedValues = {
        username: username,
        phone,
        Role,
        isActive,
      };

      user = await User.findOneAndUpdate(
        { _id: req.params.id },
        updatedValues,
        {
          new: true,
        }
      );
    } else {
      const updatedValues = {
        username: username.toLowerCase().trim().split(" ").join("-"),
        email: email,
        phone,
        Role,
        isActive,
      };

      user = await User.findOneAndUpdate(
        { _id: req.params.id },
        updatedValues,
        {
          new: true,
        }
      );
    }

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        Role: user.Role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  const username = req.params.username;

  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "User found successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        Role: user.Role,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getUserById = async (req, res, next) => {
  const userid = req.params.id;

  try {
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "User found successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        Role: user.Role,
        orders: user.orders,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Edit user password ---------------------
exports.editUserPassword = async (req, res, next) => {
  const { userId, oldPassword, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: 400,
      message: "Passwords do not match",
    });
  }

 /*if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: 400,
      message:
        "Password should:be at least 8 characters, contain one uppercase letter,contain one lowercase letter,contain one number and one special character",
    });
  }*/

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Compare the old password with the hashed password stored in the database
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        status: 400,
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { _id: userId },
      {
        password: hashedPassword,
      },
      { new: true }
    );

    return res.status(200).json({
      status: 200,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE delete user ---------------------
exports.deleteUser = async (req, res, next) => {
  const id = req.params.id;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

///create User
exports.createUser = async (req, res, next) => {
  const { username, password, confirmPassword, phone, Role } = req.body;

  // Checking if the passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      status: 400,
      message: "Passwords do not match",
    });
  }

  // if (!passwordRegex.test(password)) {
  //   return res.status(400).json({
  //     status: 400,
  //     message:
  //       "Password should:be at least 8 characters, contain one uppercase letter,contain one lowercase letter,contain one number and one special character",
  //   });
  // }

  try {
    // Checking if the phone already exists
    const existingUser = await User.findOne({
      $or: [{ phone: phone }, { username: username }],
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        return res.status(400).json({
          status: 400,
          message: "phone already exists",
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: "Username already exists",
        });
      }
    }

    // Creating a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    if (Role == "pilot") {
      const newUser = new User({
        username: username,
        phone,
        password: hashedPassword,
        Role: Role,
      });
      await newUser.save();
    } else {
      const newUser = new User({
        email: email,
        username: username,
        phone,
        password: hashedPassword,
        Role: Role,
      });
      await newUser.save();
    }

    return res.status(200).json({
      status: 200,
      message: "User Create successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.activePilot = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    if (user.Role == "pilot") {
      await User.findOneAndUpdate(
        { _id: userId },
        {
          isActive: true,
        },
        { new: true }
      );

      return res.status(200).json({
        status: 200,
        message: " Pilot is active now",
      });
    } else {
      return res.status(401).json({
        status: 401,
        message: " user may be not pilot or Role not found",
      });
    }
  } catch (error) {
    next(error);
  }
};
exports.getAllActivePilots = async (req, res, next) => {
  try {
    // Parse query parameters into integers
    const page = parseInt(req.query.page) || 1;
    const pagination = parseInt(req.query.pagination) || 10;

    // Fetch active pilots with pagination
    const pilots = await User.find({ Role: "pilot", isActive: true })
      .skip((page - 1) * pagination)
      .limit(pagination);

    // Count total active pilots
    const totalActivePilots = await User.countDocuments({
      Role: "pilot",
      isActive: true,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalActivePilots / pagination);

    // Send response
    if (pilots.length > 0) {
      return res.status(200).json({
        status: 200,
        message: "Active pilots found successfully",
        data: pilots,
        meta: {
          currentPage: page,
          totalPages: totalPages,
          lastPage: totalPages, // Assuming last page equals total pages
          totalActivePilots: totalActivePilots,
        },
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: "No active pilots found",
        data: [],
      });
    }
  } catch (error) {
    next(error);
  }
};
exports.getAllPilotHasOrder = async (req, res, next) => {
  try {
    // Parse query parameters into integers
    const page = parseInt(req.query.page) || 1;
    const pagination = parseInt(req.query.pagination) || 10;

    // Fetch active pilots with orders and pagination
    const pilots = await User.find({
      Role: "pilot",
      isActive: true,
      hasOrder: true,
    })
      .skip((page - 1) * pagination)
      .limit(pagination);

    // Count total active pilots with orders
    const totalPilotsWithOrders = await User.countDocuments({
      Role: "pilot",
      isActive: true,
      hasOrder: true,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalPilotsWithOrders / pagination);

    // Send response
    if (pilots.length > 0) {
      return res.status(200).json({
        status: 200,
        message: "Active pilots with orders found successfully",
        data: pilots,
        meta: {
          currentPage: page,
          totalPages: totalPages,
          lastPage: totalPages, // Assuming last page equals total pages
          totalPilotsWithOrders: totalPilotsWithOrders,
        },
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "No active pilots with orders found",
        data: [],
      });
    }
  } catch (error) {
    next(error);
  }
};
/* */
exports.getAvailablePilot= async(req, res, next)=>{
  try{
    const availablePilots= await User.find({ Role:'pilot', isActive: true, hasOrder: false});

    res.status(200).json({
      status: 200,
      message: 'Get all avilable pilot successfully',
      data: availablePilots
    })
  }catch(error){
    next(error);
  }
}

/** chang password for pilot  */

exports.changePasswordForPilot= async( req, res, next)=>{
  try {
    const id = req.params.id;
  const {password}= req.body;
  const user= await User.findById(id);
  console.log(user)
  if(!user){
    return res.status(404).json({
      status: 404,
      message: 'user not found '
    })
  }
  const salt = await bcrypt.genSalt(10)
  const hashedPassword= await bcrypt.hash(password, salt)
   await User.findByIdAndUpdate(id,{
    password: hashedPassword
  })
  res.status(200).json({
    status: 200,
    message: 'password changedd successfully'
  })
  } catch (error) {
    next(error)
  }
}


