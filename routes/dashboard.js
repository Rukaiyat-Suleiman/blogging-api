const express = require("express");
const Blog = require("../models/Blog");
const router = express.Router();
const authenticate = require("../auth/auth-middleware");

router.get('/dashboard', authenticate, async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.render('dashboard', { user: req.user, blogs: blogs });
    } catch (error) {
        res.status(500).render('error', { message: 'Error loading dashboard', error: error.message });
    }
});

module.exports = router;