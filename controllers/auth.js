const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user.js");

// Sign Up View
router.get("/sign-up", (req, res) => {
    res.render("auth/sign-up", { user: req.session.user , title: "Sign Up" });
});

// Sign In View
router.get("/sign-in", (req, res) => {
    res.render("auth/sign-in", { user: req.session.user , title: "Sign In" });
});

//post a new user to the database
router.post("/sign-up", async (req, res) => {
    // get data from the form (req.body)
    // check if someone already exists
    // req.body = form data
    const UserInDatabase = await User.findOne({ username: req.body.username });
    if (UserInDatabase) {
        return res.send("User already exists");
    }

    // check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
        return res.send("Passwords do not match");
    }

    // check for password complexity
    const password = req.body.password;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars || !isLongEnough) {
        return res.send("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.");
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;

    // Create new user
    const newUser = await User.create(req.body);

    // Set session data
    req.session.user = {
        username: newUser.username,
        _id: newUser._id,
    };

    // Save session and redirect
    req.session.save(() => {
        console.log(req.session);
        res.redirect('/');
    });
});

// Sign In POST
router.post("/sign-in", async (req, res) => {
    try {
        // Find user by username
        const userInDatabase = await User.findOne({ username: req.body.username });

        if (!userInDatabase) {
            return res.send("Login failed. Please try again.");
        }

        // Compare password
        const validPassword = bcrypt.compareSync(req.body.password, userInDatabase.password);

        if (!validPassword) {
            return res.send("Login failed. Please try again.");
        }

        // Set session data
        req.session.user = {
            username: userInDatabase.username,
            _id: userInDatabase._id,
        };

        // Save session and redirect
        req.session.save(() => {
            res.redirect('/');
        });

    } catch (error) {
        console.log(error);
        res.send("An error occurred. Please try again.");
    }
});

// Sign Out
router.get("/sign-out", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.send("Error logging out");
        }
        res.redirect('/');
    });
});

// Sign Out POST (keeping this for form submissions)
router.post("/sign-out", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.send("Error logging out");
        }
        res.redirect('/');
    });
});

module.exports = router;