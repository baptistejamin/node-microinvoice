# Why a different version of this package?

See: `https://www.npmjs.com/package/microinvoice` for the original package. This is a fork which I plan on updating and making more opinionated. You're welcome to use it of course this is the internet afterall.

## node-microinvoice

Fast & elegant PDF invoice generator for Node using PDFKit.

- What Microinvoice does?

* It builds invoices that **looks good**
* Generates a PDF in **less than 30ms**
* Custom Styling & Text
* Covers extended charsets like Russian, Polish (native PDF fonts only supports Latin)
* Transliterate to Latin when charset is not supported (Chinese, Arabic)

- How invoices looks like ?

![Example](/examples/example.png?raw=true "Invoice generated using Microinvoice")

## How to install?

Include `microinvoice` in your `package.json` dependencies.

Alternatively, you can run `npm install microinvoice --save`.

## How to use?

Import the module in your code:

`var MicroInvoice = require("microinvoice");`

```javascript
let myInvoice = new MicroInvoice({
  // Use example from examples/index.js
});
// Render invoice as PDF
myInvoice.generate("example.pdf").then(() => {
  console.log("Invoice saved");
});
```
