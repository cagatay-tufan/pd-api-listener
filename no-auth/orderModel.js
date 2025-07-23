const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    patientName: { type: String, required: true },
    patientOrderUuid: { type: String, required: true },
    orderStatus: { type: Number, required: true }
});

module.exports = mongoose.model("pdOrders", postSchema);
