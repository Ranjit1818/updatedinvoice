// services/pdfGenerator.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const generatePDF = async (invoiceData) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const templatePath = path.join(__dirname, "../templates", "invoice_template.html");
    const htmlContent = fs.readFileSync(templatePath, "utf-8");

    let updatedHTML = htmlContent
        .replace("{{invoice_num}}", invoiceData.invoice_num)
        .replace("{{invoice_date}}", new Date().toLocaleDateString())
        .replace("{{place_of_supply}}", "[KA] - Karnataka")
        .replace("{{bill_to}}", invoiceData.bill_to)
        .replace("{{ship_to}}", invoiceData.ship_to)
        .replace("{{items}}", invoiceData.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.item_desc}</td>
                <td>${item.hsn_sac}</td>
                <td>${item.tax}</td>
                <td>${item.qty}</td>
                <td>${item.rate_item}</td>
                <td>${item.qty * item.rate_item}</td>
            </tr>
        `).join(""))
        .replace("{{taxable_value}}", invoiceData.taxable_value)
        .replace("{{total_tax_amount}}", invoiceData.total_tax_amount)
        .replace("{{taxable_amount}}", invoiceData.taxable_amount)
        .replace("{{round_off}}", invoiceData.round_off)
        .replace("{{total}}", invoiceData.total)
        .replace("{{amount_in_words}}", invoiceData.amount_in_words);

    await page.setContent(updatedHTML);
    const pdf = await page.pdf({ format: "A4" });
    await browser.close();

    return pdf;
};

module.exports = { generatePDF };
