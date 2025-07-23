const express = require("express");

const router = express.Router();

const Order = require("./orderModel");


const pdApiDeveloper = require('../pd-api-developer');




router.get("", (req, res, next) => { //Inside browser call http://localhost:3001/api/order
    const pdApi = new pdApiDeveloper.postDicomCloudApi('354ae8a4-5c97-4f78-8b6a-ced4d4fe9388', '3cf32118-c303-4831-866f-df60f2d43d5d');

    pdApi.Initialize((rs) => {
        console.log(rs)
        pdApi.GetPatientOrderList((rs) => {
            console.log(rs)
            for (var i = 0; i < rs.SearchResultList.length; i++) {
                const order = new Order({
                    patientName: rs.SearchResultList[i].PatientName,
                    patientOrderUuid: rs.SearchResultList[i].PatientOrderUuid,
                    orderStatus: rs.SearchResultList[i].OrderStatus
                });
                order.save().then(insertedOrder => {
                    console.log(insertedOrder)

                });
            }

            res.status(200).json({
                message: "Orders inserted successfully.",
            });
        }, "1a57f1d0-8b66-4b03-9c22-2fc6b80770c1", ["17c0f082-a4fa-4bb5-8584-cb29a6aa89d8"])
    });
});

router.post("", (req, res, next) => { //From ShellServer
    const pdApi = new pdApiDeveloper.postDicomCloudApi('354ae8a4-5c97-4f78-8b6a-ced4d4fe9388', '3cf32118-c303-4831-866f-df60f2d43d5d');

    pdApi.Initialize((rs) => {
        console.log(rs)
        pdApi.GetPatientOrderList((rs) => {
            console.log(rs)
            for (var i = 0; i < rs.SearchResultList.length; i++) {
                const order = new Order({
                    patientName: rs.SearchResultList[i].PatientName,
                    patientOrderUuid: rs.SearchResultList[i].PatientOrderUuid,
                    orderStatus: rs.SearchResultList[i].OrderStatus
                });
                order.save().then(insertedOrder => {
                    console.log(insertedOrder)

                });
            }

            res.status(200).json({
                message: "Orders inserted successfully.",
            });
        }, "1a57f1d0-8b66-4b03-9c22-2fc6b80770c1", ["17c0f082-a4fa-4bb5-8584-cb29a6aa89d8"])
    });
});

//router.post("/update", (req, res, next) => { //Buras? URL den gelenler için: "http://localhost:3001/api/order/insert?patientName=testname&patientOrderUuid=123&orderStatus=70"
//    const order = new Order({
//        patientName: req.query.patientName,
//        patientOrderUuid: req.query.patientOrderUuid,
//        orderStatus: req.query.orderStatus
//    });
//    order.save().then(insertedOrder => {
//        res.status(201).json({
//            message: "Order inserted successfully.",
//            order: {
//                ...insertedOrder,
//                id: insertedOrder._id
//            }
//        });
//    });
//});

router.post("/update", (req, res, next) => {
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