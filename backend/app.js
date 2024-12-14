// Import necessary modules
const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const { toWords } = require("number-to-words");

const app = express();
const fs = require('fs');
// Middleware
app.use(express.json());
app.use(cors());

// Endpoint to generate invoice
app.post("/api/generate-invoice", (req, res) => {
  const { invoice_num, bill_to, ship_to,gst_num, items } = req.body;

  // Validate request body
  if (!invoice_num || !bill_to || !ship_to || !gst_num|| !Array.isArray(items)) {
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
    return sum + qty * rate * (1);
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
  doc.fontSize(16).font("Helvetica-Bold").text("INVOICE", pageWidth - margin - 270, 20, { align: "Center" });
  doc.fontSize(18).font("Helvetica-Bold").text("VIDWAT ASSOCIATES", pageWidth - margin - 496, 45, { align: "left" });
  doc.fontSize(10)
    .font("Helvetica")
    .text("#33, Arvind Nagar", margin, 62)
    .text("Near Veer Savarkar Circle", margin, 75)
    .text("Vijayapur 586101, Karnataka, India", margin, 90)
    .text("PAN: AAZFV2824J", margin, 105)
    .text("GST: 29AAZFV2824J1ZB", margin, 120)
    .text("Email: vidwatassociates@gmail.com", margin, 135)
    .text("Phone: 7892787054", margin, 150);

  // Horizontal line below header
  doc.moveTo(margin, 160).lineTo(pageWidth - margin, 160).stroke();

  // Invoice Details
  doc.fontSize(10)
    .font("Helvetica-Bold")
    .text(`Invoice No: ${invoice_num}`, pageWidth - margin - 100, 80, { align: "center" })
.text(`Invoice Date: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - margin - 143, 95, { align: "center" });
    doc.moveTo(margin, 160).lineTo(pageWidth - margin, 160).stroke();

    // Draw border for "Bill To" and "Ship To" sections
    const billShipY = 180;
    const boxWidth = pageWidth - 2 * margin;
    const boxHeight = 90;
  
    doc.rect(margin, billShipY - 10, boxWidth, boxHeight).stroke("black");
  
    // Billing and Shipping Details
    const columnWidth = boxWidth / 2;
    doc.moveTo(margin + columnWidth, billShipY - 10)
    .lineTo(margin + columnWidth, billShipY - 10 + boxHeight)
    .stroke("black");
  
    // "Bill To" section
    doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", margin + 10, billShipY);
    doc.fontSize(10)
      .font("Helvetica")
      .text(bill_to || "N/A", margin + 20, billShipY + 15)
      .text("Karnataka,", margin +20, billShipY + 30)
      .text(`${bill_to.phone || "India"}`, margin + 20, billShipY + 45)
      .text(`${gst_num || "India"}`, margin + 20, billShipY + 60);
  
    // "Ship To" section
    doc.fontSize(12).font("Helvetica-Bold").text("Ship To:", margin + columnWidth + 10, billShipY);
    doc.fontSize(10)
      .font("Helvetica")
      .text(ship_to || "N/A", margin + columnWidth + 20, billShipY + 15)
      .text("Karnataka,", margin + columnWidth + 20, billShipY + 30)
      .text(`${ship_to.phone || "India"}`, margin + columnWidth + 20, billShipY + 45)
      .text(`${gst_num || "India"}`, margin + columnWidth + 20, billShipY + 60);


  // Table positions
  let tableStartY = billShipY + 120; // Adjusted to add more space below "Bill To" and "Ship To"
  const rowHeight = 20;
  const colWidths = [40, 160, 100, 100, 100];

  // Helper function for drawing rows
  const drawRow = (columns, y) => {
    let x = margin;
    columns.forEach((col, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(col, x + 5, y + 5, { width: colWidths[i] - 10, align: "left" });
      x += colWidths[i];
    });
  };
// First Table: Item Details
function drawBoldRow(columns, y) {
  let x = margin;
    columns.forEach((col, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(col, x + 5, y + 5, { width: colWidths[i] - 10, align: "left" });
      x += colWidths[i];
    });
}


drawBoldRow(["SL", "ITEM DESCRIPTION", "RATE/ITEM", "QUANTITY", "AMOUNT"], tableStartY);
tableStartY += rowHeight;

items.forEach((item, index) => {
  const qty = Number(item.qty);
  const rate = Number(item.rate_item);
  const amount = (qty * rate).toFixed(2);

  drawRow([
    `${index + 1}`,
    `${item.item_desc}`,
    `${rate.toFixed(2)}`,
    `${qty}`,
    ` ${amount}`
  ], tableStartY);

  tableStartY += rowHeight;
});

tableStartY += rowHeight; // Add vertical gap between tables

// Second Table: Tax Summary

drawBoldRow(["SL", "HSN/SAC", "TAX%", "AMOUNT"], tableStartY);
tableStartY += rowHeight;

items.forEach((item, index) => {
  const tax = Number(item.tax);
  const taxAmount = (Number(item.qty) * Number(item.rate_item) * (tax / 100)).toFixed(2);

  drawRow([
    `${index + 1}`,
    `${item.hsn_sac || "-"}`,
    `${tax}%`,
    `${taxAmount}`
  ], tableStartY);

  tableStartY += rowHeight;
});
// Third Table: Amount Payable and In Words
tableStartY += rowHeight; // Add vertical gap
const thirdTableColWidths = [200, pageWidth - margin * 2 - 200];

// First row: Amount Payable
doc.rect(margin, tableStartY, thirdTableColWidths[0], rowHeight).stroke();
doc.font("Helvetica-Bold").text("Amount Payable", margin + 5, tableStartY + 5, { width: thirdTableColWidths[0] - 10, align: "left" });

doc.rect(margin + thirdTableColWidths[0], tableStartY, thirdTableColWidths[1], rowHeight).stroke();
doc.font("Helvetica-Bold").text(` ${totalAmount.toFixed(2)}`, margin + thirdTableColWidths[0] + 5, tableStartY + 5, { width: thirdTableColWidths[1] - 10, align: "left" });

tableStartY += rowHeight;

// Second row: Amount in Words
doc.rect(margin, tableStartY, thirdTableColWidths[0], rowHeight).stroke();
doc.font("Helvetica-Bold").text("In Words", margin + 5, tableStartY + 5, { width: thirdTableColWidths[0] - 10, align: "left" });

const capitalizeSentences = (text) => {
  return text
    .split(/([.?!])\s*/g) // Split by sentence-ending punctuation and keep it.
    .map((sentence, index) =>
      index % 2 === 0 ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : sentence
    ) // Capitalize sentences but keep punctuation as is.
    .join('');
};

const amountInWords = capitalizeSentences(
  toWords(totalAmount).replace(/,/g, "") + " Rupees Only"
);

doc.rect(margin + thirdTableColWidths[0], tableStartY, thirdTableColWidths[1], rowHeight).stroke();
doc.font("Helvetica-Bold").text(amountInWords, margin + thirdTableColWidths[0] + 5, tableStartY + 5, { width: thirdTableColWidths[1] - 10, align: "left" });

  // Footer
  const footerY = 500;
  doc.fontSize(10)
    .font("Helvetica")
    .font("Helvetica-Bold")
    .text("Terms and Conditions:", pageWidth - 550, footerY +96, { align: "left" })
    .text("1.All payments should be made electronically in the name of Vidwat Associates", pageWidth - 530, footerY + 112, { align: "left" })
    .text("2.All disputes shall be subjected to jurisdiction of Vijayapur", pageWidth  - 530, footerY + 127, { align: "left" })
    .text("3.This invoice is subjected to the terms and conditions mentioned in the agreement or work order", pageWidth  - 530, footerY + 142, { align: "left" });
   
    // Add Authorized Sign text
doc.fontSize(8)
   .font("Helvetica-Bold")
   .text("Authorized Signatory", pageWidth - margin - 150, footerY + 220, {
       align: "center"
   });

  // Finalize the PDF
  doc.end();
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
