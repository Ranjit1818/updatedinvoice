const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.createPDF = ({ invoice_num, bill_to, ship_to, items }, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument();

            // Ensure the directory exists
            const dir = "./generated_invoices";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Add content to PDF
            doc.fontSize(20).text(`Invoice #${invoice_num}`, { align: "center" });
            doc.moveDown();
            doc.fontSize(14).text(`Bill To: ${bill_to}`);
            doc.text(`Ship To: ${ship_to}`);
            doc.moveDown();

            // Add table for items
            doc.fontSize(12).text("Items:");
            items.forEach((item, index) => {
                doc.text(
                    `${index + 1}. ${item.item_desc} | HSN/SAC: ${item.hsn_sac} | Qty: ${item.qty} | Rate: ${item.rate_item} | Tax: ${item.tax}%`
                );
            });

            doc.moveDown();
            doc.text("Thank you for your business!", { align: "center" });

            // Finalize the PDF
            doc.end();

            // Resolve when write is complete
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        } catch (err) {
            reject(err);
        }
    });
};
