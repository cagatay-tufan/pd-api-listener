const express = require("express");
const router = express.Router();

const authenticate = require('./basicAuthentication');


router.post("/update", authenticate, (req, res, next) => {
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