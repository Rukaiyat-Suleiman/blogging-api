const express = require("express");
const router = express.Router();
const { generateToken } = require("../helpers/jwt-helper");
const User = require("../models/User");

router.get('/signup', (req, res) => {
    res.render('user-signup');
});

router.get('/login', (req, res) => {
    res.render('user-login');
});

router.get("/logout", (req, res) => {
    res.clearCookie('token', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict' 
    });
    res.redirect('/auth/user-login');
});

router.post("/signup", async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        console.log(req.method, " request to url ", req.url);

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).render('user-signup', { 
                message: "All fields are required, you might be missing something...", 
                error: null 
            });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('user-signup', { 
                message: "A user with this email already exists...", 
                error: null 
            });
        }

        const newUser = new User({
            first_name,
            last_name,
            email,
            password
        });

        await newUser.save();

        const token = generateToken(newUser._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 24 * 60 * 60 * 1000
        });

        res.setHeader('Authorization', `Bearer ${token}`);

        return res.redirect("/");

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).render('error', { 
                message: "Server error, user validation failed", 
                error: error.message 
            });
        }
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.method, " request to url ", req.url);

        if (!email || !password) {
            console.log("might not have entered some stuff");
            return res.status(400).render('user-login', { 
                message: "Email and password are required, you might be missing something...", 
                error: null 
            });
        }

        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            console.log("Incorrect info/info doesn't align with schema00");
            return res.status(400).render("error", { 
                message: "Invalid email or password", 
                error: null
            });
        }

        const isPasswordCorrect = await foundUser.comparePassword(password);
        if (!isPasswordCorrect) {
            console.log("Incorrect info/info doesn't align with schema01"); 
            return res.status(400).render('user-login', { 
                message: "Invalid email or password", 
                error: null 
            });
        }

        const token = generateToken(foundUser._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        return res.redirect('/');

    } catch (error) {
        return res.status(400).render('error', { 
            message: "server error, unable to log in", 
            error: error.message 
        });
    }
});

module.exports = router;