const { verifyToken } = require("../helpers/jwt-helper");
const User = require("../models/User");

const authenticate = async function(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).render('error', { 
                message: "Access denied, please log in first",
                error: "No authentication token provided"
            });
        }

        const decoded = verifyToken(token);

        const foundUser = await User.findById(decoded.userid).select("-password");
        if (!foundUser) {
            return res.status(401).render('error', { 
                message: "Access denied",
                error: "User no longer exists"
            });
        }

        req.user = foundUser;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).render('error', { 
                message: "Session expired",
                error: "Please log in again"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).render('error', { 
                message: "Invalid session",
                error: "Please log in again"
            });
        }
        
        return res.status(500).render('error', { 
            message: "Server error during authentication",
            error: error.message
        });
    }
};

module.exports = authenticate;