const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
require("dotenv").config(); 
 
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const orderRouter = require("./routes/order");
const authenticateToken = require("./middlewares/authenticateToken");
const { fileStorage, fileFilter } = require("./utils/functions");
const { initializeSocket } = require("./socket/initializeSocket.js");
// console.log(socketId);
const port = process.env.PORT || 4000;
const host = process.env.HOST || "localhost";

const app = express();
const server = http.createServer(app);
const { io, userSocketIds } = initializeSocket(server); // Initialize Socket.IO here
app.use((req, res, next) => {
  req.io = io;
  req.userSocketIds = userSocketIds; // Pass userSocketIds to the request object
  next();
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1); // Exit the application on database connection error
  });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(logger("dev"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).fields([
    {
      name: "image",
    },
  ])
);
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => res.send("Hello World!")); // Test route
app.use("/auth", authRouter);

app.use(authenticateToken); // Authenticate user
app.use("/user", userRouter);
app.use("/order", orderRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500).send({
    status: err.status || 500,
    message: err.message,
  });
});

// Start the server
server.listen(port, host, () => {
  console.log(`Server is running on port ${port}`);
});
