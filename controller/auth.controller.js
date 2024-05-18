const User = require("../models/user.schema");
const bcrypt = require("bcryptjs");
const {
  generateToken,
  randomPasswordSchema,
  isLikelyEmail,
} = require("../utils/functions");
// const { passwordRegex } = require("../constants/index");

const nodemailer = require("nodemailer");

// -------------------- login --------------------
exports.login = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;

    // check if user login with Email or phone by this function "isLikelyEmail"
    if (isLikelyEmail(emailOrPhone)) {
      console.log("here ?");
      const user = await User.findOne({ email: emailOrPhone.toLowerCase() });

      if (!user) {
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }
      // compare when login by email if user Enter email to login
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }
      // generate token when login by email

      const token = generateToken(user.username);
      // login by Email send Endpoint

      return res.status(200).json({
        status: 200,
        message: "Logged in successfully",
        data: {
          username: user.username,
          email: user.email.toLowerCase(),
          id: user._id,
          role: user.Role,
          image: user.image,
          token,
        },
      });
    } else {
      // login by phone if user enter phone number
      const user = await User.findOne({ phone: emailOrPhone });
      if (!user) {
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }
      // compare when login by email if user Enter phone to login

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }
      // generate token when login by phone

      const token = generateToken(user.username);
      // login by phone send Endpoint

      return res.status(200).json({
        status: 200,
        message: "Logged in successfully",
        data: {
          username: user.username,
          id: user._id,
          role: user.Role,
          image: user.image,
          token,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// -------------------- signup --------------------

exports.signup = async (req, res, next) => {
  const { username, password, confirmPassword, phone, email, Role } = req.body;
  // const unifiedUsername = username.toLowerCase().trim().split(" ").join("-");
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

    // Saving the user

    return res.status(200).json({
      status: 200,
      message: "User signed up successfully",
    });
  } catch (err) {
    // console.log(err);
    return res.status(500).json({
      status: 500,
      message: err?.message,
    });
  }
};
// POST reset password user ---------------------
exports.resetPassword = async (req, res, next) => {
  const { emailOrPhone } = req.body;

  try {
    if (isLikelyEmail(emailOrPhone)) {
      const user = await User.findOne({ email: emailOrPhone });
      console.log(user);

      if (!user) {
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }

      const newPassword = randomPasswordSchema();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findOneAndUpdate(
        { email: emailOrPhone },
        {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      );

      const transporter = nodemailer.createTransport({
        host: process.env.HOST,
        port: 587,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: emailOrPhone,
        subject: "Password Reset",
        text: `Your new password is: ${newPassword}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          return res.status(500).json({ message: "Failed to send email" });
        } else {
          console.log("Email sent:", info.response);
          return res.status(200).json({ message: "Password reset successful" });
        }
      });
    } else {
      const user = await User.findOne({ phone: emailOrPhone });
      console.log(user);

      if (!user) {
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }

      const newPassword = randomPasswordSchema();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findOneAndUpdate(
        { phone: emailOrPhone },
        {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      );

      const transporter = nodemailer.createTransport({
        host: process.env.HOST,
        port: 587,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Password Reset",
        text: `Your new password is: ${newPassword}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          return res.status(500).json({ message: "Failed to send email" });
        } else {
          console.log("Email sent:", info.response);
          return res.status(200).json({ message: "Password reset successful" });
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};
