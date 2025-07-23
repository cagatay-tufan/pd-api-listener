const express = require("express");
const router = express.Router();
const jwtAuthentication = require("./jwtAuthentication");

// Protected route
router.post("/", jwtAuthentication, (req, res) => {
    const patientOrder = req.body.PatientOrder;
    console.log(patientOrder)
    res.status(201).json({
        message: "PatientOrder received successfully",
        patientOrder: {
            ...patientOrder
        }
    });
});

module.exports = router;