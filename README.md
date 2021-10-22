# node-microinvoice

[![NPM](https://img.shields.io/npm/v/microinvoice.svg)](https://www.npmjs.com/package/microinvoice) [![Downloads](https://img.shields.io/npm/dt/microinvoice.svg)](https://www.npmjs.com/package/microinvoice) 

Fast & elegant PDF invoice generator for Node using PDFKit.

* What Microinvoice does?

- It builds invoices that **looks good**
- Generates a PDF in **less than 30ms**
- Custom Styling & Text
- Covers exterded charsets like Russian, Polish (native PDF fonts only supports Latin)

## Why another invoice generator

This project was made for our own company [Crisp](https:/crisp.chat/). We are generating everymonth thousands of HTML invoices. Given this scale, using Puppeteer for generating HTML to PDF would be very inefficient.

As everyday, our customers were asking for PDF invoices as some accounting softwares automatically fetch invoices from emails. I could really understand their frustration. At the end, why generating PDF should be easy?

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.chat/"><img src="https://crisp.chat/favicon.png" width="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
</tr>
</table>

_👋 You use microinvoice and you want to be listed there? [Contact me](https://jamin.me/)._

## How to install?

Include `microinvoice` in your `package.json` dependencies.

Alternatively, you can run `npm install microinvoice --save`.

## How to use?

This module may be used to acquire the billable VAT percentage for a given customer. You may also use it directly to process the total amount including VAT you should bill; and even to validate a customer's VAT number.

**:red_circle: Important: in order to fetch the sales tax for a customer, you need to know their country (and sometimes state). The country (sometimes state) must be passed to all module methods, formatted as ISO ALPHA-2 (eg. France is FR, United States is US).**

### :arrow_right: Import the module

Import the module in your code:

`var MicroInvoice = require("microinvoice");`

```javascript
// Render invoice as PDF
myInvoice.generate("example.pdf").then(() => {
  console.log("Invoice saved");
});

```
