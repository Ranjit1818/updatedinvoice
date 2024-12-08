// Import necessary modules
const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const { toWords } = require("number-to-words");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Endpoint to generate invoice
app.post("/api/generate-invoice", (req, res) => {
  const { invoice_num, bill_to, ship_to, items } = req.body;

  // Validate request body
  if (!invoice_num || !bill_to || !ship_to || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }

  // Validate items
  for (const item of items) {
    if (
      !item.item_desc ||
      isNaN(Number(item.qty)) ||
      isNaN(Number(item.rate_item)) ||
      isNaN(Number(item.tax))
    ) {
      return res
        .status(400)
        .json({ error: "Invalid item data: ensure all fields are correct" });
    }
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.qty);
    const rate = Number(item.rate_item);
    const tax = Number(item.tax);
    return sum + qty * rate * (1 + tax / 100);
  }, 0);

  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Set headers to indicate a downloadable file
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice_${invoice_num}.pdf`
  );

  // Stream the PDF directly to the client
  doc.pipe(res);

  // Add content to the PDF
  const pageWidth = 595;
  const margin = 50;

  // Company Details and Invoice Header
  doc.fontSize(16).font("Helvetica-Bold").text("INVOICE", pageWidth - margin - 260, 20, { align: "Center" });
  doc.fontSize(18).font("Helvetica-Bold").text("VIDWAT ASSOCIATES", pageWidth - margin - 500, 30, { align: "left" });
  doc.fontSize(10)
    .font("Helvetica")
    .text("#33, ARVIND NAGAR", margin, 60)
    .text("NEAR VEER SAVARKAR CIRCLE", margin, 75)
    .text("VIJAYAPUR 586101, Karnataka, India", margin, 90)
    .text("PAN: AAZFV2824J", margin, 105)
    .text("Email: vidwatassociates@gmail.com", margin, 120)
    .text("Phone: 7892787054", margin, 135);

  // Horizontal line below header
  doc.moveTo(margin, 160).lineTo(pageWidth - margin, 160).stroke();

  // Invoice Details
  doc.fontSize(10)
    .font("Helvetica-Bold")
    .text(`Invoice #: ${invoice_num}`, pageWidth - margin - 100, 80, { align: "right" })
    .text(`Invoice Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 100, 95, { align: "right" });

  // Billing and Shipping Details
  const billShipY = 180;
  const columnGap = 400;
  const rowSpacing = 70;

  doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", margin, billShipY);
  doc.fontSize(10)
    .font("Helvetica")
    .text(bill_to || "N/A", margin, billShipY + 15)
    .text("Karnataka,", margin, billShipY + 30)
    .text(`${bill_to.phone || "India"}`, margin, billShipY + 45);

  doc.fontSize(12).font("Helvetica-Bold").text("Ship To:", margin + columnGap, billShipY);
  doc.fontSize(10)
    .font("Helvetica")
    .text(ship_to || "N/A", margin + columnGap, billShipY + 15)
    .text("Karnataka,", margin + columnGap, billShipY + 30)
    .text(`${bill_to.phone || "India"}`, margin + columnGap, billShipY + 45);

  // Table positions
  let tableStartY = billShipY + rowSpacing;
  const rowHeight = 20;
  const colWidths = [40, 160, 100, 100, 100];

  // Helper function for drawing rows
  const drawRow = (columns, y) => {
    let x = margin;
    columns.forEach((col, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(col, x + 5, y + 5);
      x += colWidths[i];
    });
  };

  // First Table: Item Details
  drawRow(["SL", "ITEM DESCRIPTION", "RATE/ITEM", "QUANTITY", "AMOUNT"], tableStartY);
  tableStartY += rowHeight;

  items.forEach((item, index) => {
    const qty = Number(item.qty);
    const rate = Number(item.rate_item);
    const amount = (qty * rate).toFixed(2);

    drawRow([
      `${index + 1}`,
      `${item.item_desc}`,
      `$ ${rate.toFixed(2)}`,
      `${qty}`,
      `$ ${amount}`
    ], tableStartY);

    tableStartY += rowHeight;
  });

  tableStartY += rowHeight; // Add vertical gap between tables

  // Second Table: Tax Summary
  drawRow(["SL", "HSN/SAC", "TAX%", "AMOUNT"], tableStartY);
  tableStartY += rowHeight;

  items.forEach((item, index) => {
    const tax = Number(item.tax);
    const taxAmount = (Number(item.qty) * Number(item.rate_item) * (tax / 100)).toFixed(2);

    drawRow([
      `${index + 1}`,
      `${item.hsn_sac || "-"}`,
      `${tax}%`,
      `$ ${taxAmount}`
    ], tableStartY);

    tableStartY += rowHeight;
  });

  // Convert total amount to words
  const amountInWords = toWords(totalAmount).replace(/,/g, "") + " Rupees Only";

  // Footer
  const footerY = 600;
  doc.fontSize(10)
    .font("Helvetica")
    .text(`Amount Chargeable (in Words): ${amountInWords}`, margin, footerY, { align: "left" })
    .font("Helvetica-Bold")
    .text("Authorized Signatory", pageWidth - margin - 150, footerY + 120, { align: "right" });

  // Finalize the PDF
  doc.end();
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
