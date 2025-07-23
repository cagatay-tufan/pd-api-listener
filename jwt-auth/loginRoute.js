const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

router.get("/", (req, res) => {
    const user = { id: 1, username: "john_doe" };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
    console.log(token);
});


module.exports = router;