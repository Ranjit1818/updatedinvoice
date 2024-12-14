const express = require("express");
const { generateInvoicePDF } = require("../controllers/invoiceController");
const router = express.Router();

router.post("/generate-invoice", async (req, res) => {
    try {
        const invoiceData = req.body;

        // Log the received data for debugging
        console.log("Received invoice data:", invoiceData);
        
        // Generate the PDF as a stream
        const pdfStream = await generateInvoicePDF(invoiceData);

        // Send the PDF stream as a response
        res.status(200).set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=invoice_${invoiceData.invoice_num}.pdf`,
        });

        pdfStream.pipe(res); // Stream PDF directly to the response
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        res.status(500).send("Failed to generate invoice");
    }
});

module.exports = router;
