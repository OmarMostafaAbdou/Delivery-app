const jwt = require("jsonwebtoken");
const multer = require("multer");
const secretKey = process.env.SECRET_KEY || "secret";

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, secretKey, { expiresIn: "1h" });

  return token;
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(file);
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// ----------- random password generator ------------
const randomPasswordSchema = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = '!@#$%^&*()_+{}|:"<>?~`';

  // Combine random characters
  const allCharacters = [uppercase, lowercase, numbers, symbols];

  // Combine random characters
  let randomPassword = "";

  allCharacters.forEach((type) => {
    let randomIndex = Math.floor(Math.random() * type.length);
    randomPassword += type[randomIndex];
    randomIndex = Math.floor(Math.random() * type.length);
    randomPassword += type[randomIndex];
  });

  return randomPassword;
};
function isLikelyEmail(input) {
  return input.includes("@");
}

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
module.exports = {
  generateToken,
  fileStorage,
  randomPasswordSchema,
  isLikelyEmail,
  fileFilter,
};
