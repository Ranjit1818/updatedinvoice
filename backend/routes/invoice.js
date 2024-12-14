const express = require("express");
const { generateInvoicePDF } = require("../controllers/invoiceController");
const router = express.Router();

router.post("/generate-invoice", async (req, res) => {
    try {
        const invoiceData = req.body;

        // Log the received data for debugging
        console.log("Received invoice data:", invoiceData);

        // Call the function to generate the PDF stream
        const pdfStream = await generateInvoicePDF(invoiceData);

        // Check if the returned stream is valid
        if (!pdfStream || typeof pdfStream.pipe !== "function") {
            throw new Error("PDF generation failed: Invalid stream.");
        }

        // Set headers for the PDF response
        res.status(200).set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=invoice_${invoiceData.invoice_num}.pdf`,
        });

        // Pipe the PDF stream directly to the response
        pdfStream.pipe(res);

        // Handle stream errors (e.g., in case of a failed stream write)
        pdfStream.on("error", (streamError) => {
            console.error("Error streaming PDF:", streamError);
            res.status(500).send("Failed to stream invoice PDF");
        });
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        res.status(500).send("Failed to generate invoice");
    }
});

module.exports = router;

