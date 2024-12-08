const express = require("express");
const router = express.Router();

// Import API routes
const generateInvoiceRoute = require("./api/generate-invoice");

// Use the routes
router.use("/api/generate-invoice", generateInvoiceRoute);

module.exports = router;
