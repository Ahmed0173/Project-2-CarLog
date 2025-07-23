const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const authController = require("./controllers/auth.js");
const listingController = require("./controllers/listing.controllers.js");
const commentController = require("./controllers/comment.controller.js");
const myCarsController = require("./controllers/MyCars.controllers.js");
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");

// Set the port from environment variable or default to 3000
const port = process.env.PORT ? process.env.PORT : "3000";

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Set the view engine to ejs
app.set("view engine", "ejs");

// Configure sessions
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Serve static files from public directory
app.use(express.static("public"));

// Middleware to parse URL-encoded data from forms
app.use(express.urlencoded({ extended: false }));
// Middleware for using HTTP verbs such as PUT or DELETE
app.use(methodOverride("_method"));
// Morgan for logging HTTP requests
app.use(morgan('dev'));
// Pass user to all views
app.use(passUserToView);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});

// Import routes
app.use("/auth", authController);
app.use("/", listingController);
app.use("/", commentController);
app.use("/", myCarsController);

app.get("/", (req, res) => {
  res.render("Home", { title: "Home" });
});