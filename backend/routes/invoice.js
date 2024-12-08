const express = require("express");
const { generateInvoicePDF } = require("../controllers/invoiceController");
const router = express.Router();

router.post("/generate-invoice", async (req, res) => {
    try {
        const invoiceData = req.body; // Get data from the request
        const pdfBuffer = await generateInvoicePDF(invoiceData);

        // Send the PDF as a response
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=invoice_${invoiceData.invoice_num}.pdf`,
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        res.status(500).send("Failed to generate invoice");
    }
});

module.exports = router;
