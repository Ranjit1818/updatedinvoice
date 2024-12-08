const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const generateInvoicePDF = async (invoiceData) => {
    const templatePath = path.join(__dirname, "../templates/invoice_template.html");
    const htmlContent = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders in the HTML with actual data
    const updatedHTML = htmlContent
        .replace("{{invoice_num}}", invoiceData.invoice_num)
        .replace("{{invoice_date}}", new Date().toLocaleDateString())
        .replace("{{bill_to}}", invoiceData.bill_to)
        .replace("{{ship_to}}", invoiceData.ship_to)
        .replace("{{items}}", invoiceData.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.item_desc}</td>
                <td>${item.hsn_sac || "-"}</td>
                <td>${item.tax}%</td>
                <td>${item.qty}</td>
                <td>${item.rate_item.toFixed(2)}</td>
                <td>${(item.qty * item.rate_item).toFixed(2)}</td>
            </tr>
        `).join(''))
        .replace("{{taxable_value}}", invoiceData.taxable_value.toFixed(2))
        .replace("{{total_tax_amount}}", invoiceData.total_tax_amount.toFixed(2))
        .replace("{{taxable_amount}}", invoiceData.taxable_amount.toFixed(2))
        .replace("{{round_off}}", invoiceData.round_off.toFixed(2))
        .replace("{{total}}", invoiceData.total.toFixed(2))
        .replace("{{amount_in_words}}", invoiceData.amount_in_words || "Amount in words not available");

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Load the updated HTML into Puppeteer
    await page.setContent(updatedHTML);

    // Generate the PDF
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();
    return pdfBuffer;
};

module.exports = { generateInvoicePDF };
