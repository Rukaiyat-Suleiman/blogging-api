const express = require("express");
const app = express();
const connectDB = require("./database/connection");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));

app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/blog-routes"));
app.use("/", require("./routes/dashboard"));

app.use((req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/blogs') || req.path === '/' || req.path.startsWith('/dashboard')) {
        return next();
    }
    const authenticate = require("./auth/auth-middleware");
    authenticate(req, res, next);
});

app.get('/blog/create', (req, res) => {
    const authenticate = require("./auth/auth-middleware");
    authenticate(req, res, () => {
        res.render('create-blog');
    });
});

app.use((req, res) => {
    res.status(404).render('error', {
        message: "The page you are looking for does not exist.",
        error: "404 Not Found"
    });
});

connectDB();