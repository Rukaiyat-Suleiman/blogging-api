const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async function() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.log("Error connecting to database:", error);
        process.exit(1);
    }
};

module.exports = connectDB