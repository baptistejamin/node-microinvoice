"use strict";

const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const _merge = require("lodash.merge");
const transliterate = require("transliteration").transliterate;

/**
 * Invoice
 * This is the constructor that creates a new instance containing the needed
 * methods.
 *
 * @name Invoice
 * @function
 * @param {Object} options The options for creating the new invoice:
 */
module.exports = class Microinvoice {
  constructor(options) {
    this.defaultOptions = {
      style: {
        document: {
          marginLeft: 30,
          marginRight: 30,
          marginTop: 30,
        },

        fonts: {
          normal: {
            name: "OpenSans",
            path: path.join(__dirname, "../res/fonts/", "OpenSans-Regular.ttf"),
          },
          bold: {
            name: "OpenSans-Bold",
            path: path.join(__dirname, "../res/fonts/", "OpenSans-Bold.ttf"),
          },
        },
        header: {
          backgroundColor: "#F8F8FA",
          height: 150,
          image: null,
          textPosition: 330,
        },
        table: {
          item: {
            position: 30,
            maxWidth: 285,
          },
          quantity: {
            position: 330,
            maxWidth: 65,
          },
          rate: {
            position: 410,
            maxWidth: 65,
          },
          amount: {
            position: 490,
            maxWidth: 75,
          },
        },
        total: {
          label: {
            position: 395,
            maxWidth: 90,
          },
          content: {
            position: 505,
            maxWidth: 90,
          },
        },
        text: {
          primaryColor: "#000100",
          secondaryColor: "#8F8F8F",
          headingSize: 15,
          regularSize: 10,
        },
      },

      data: {
        invoice: {
          name: "Invoice for Acme",
          header: [
            {
              label: "Invoice Number",
              value: 1,
            },
          ],
          customer: [
            {
              label: "Bill To",
              value: [],
            },
          ],
          seller: [
            {
              label: "Bill From",
              value: [],
            },
          ],
          details: {
            header: [
              {
                value: "Description",
              },
              {
                value: "Quantity",
              },
              {
                value: "Subtotal",
              },
            ],
            parts: [],
            total: [
              {
                label: "Total",
                value: 0,
              },
            ],
          },
          legal: [],
        },
      },
    };

    this.options = _merge(this.defaultOptions, options);

    this.storage = {
      header: {
        image: null,
      },
      cursor: {
        x: 0,
        y: 0,
      },
      customer: {
        height: 0,
      },
      seller: {
        height: 0,
      },
      fonts: {
        fallback: {
          loaded: false,
        },
      },
      document: null,
    };
  }

  /**
   * Load custom fonts
   *
   * @private
   * @return void
   */
  loadCustomFonts() {
    // Register custom fonts
    if (this.options.style.fonts.normal.path) {
      this.document.registerFont(
        this.options.style.fonts.normal.name,
        this.options.style.fonts.normal.path
      );
    }

    if (this.options.style.fonts.bold.path) {
      this.document.registerFont(
        this.options.style.fonts.bold.name,
        this.options.style.fonts.bold.path
      );
    }
  }

  /**
   * Load fallback font (unicode chars)
   *
   * @private
   * @return string
   */
  getFont(type) {
    return type === "normal" ? "OpenSans" : "OpenSans-Bold";
  }

  /**
   * Generates the header
   *
   * @private
   * @return void
   */
  generateHeader() {
    // Background Rectangle
    this.document
      .rect(0, 0, this.document.page.width, this.options.style.header.height)
      .fill(this.options.style.header.backgroundColor);

    // Add an image to the header if any
    if (
      this.options.style.header.image &&
      this.options.style.header.image.path
    ) {
      this.document.image(
        this.options.style.header.image.path,
        this.options.style.document.marginLeft,
        this.options.style.document.marginTop,
        {
          width: this.options.style.header.image.width,
          height: this.options.style.header.image.height,
        }
      );
    }

    let _fontMargin = 4;

    // Write header details
    this.setCursor("x", this.options.style.header.textPosition);
    this.setCursor("y", this.options.style.document.marginTop);

    this.setText(this.options.data.invoice.name, {
      fontSize: "heading",
      fontWeight: "bold",
      color: this.options.style.header.regularColor,
    });

    this.options.data.invoice.header.forEach((line) => {
      this.setText(`${line.label}:`, {
        fontWeight: "bold",
        color: this.options.style.header.regularColor,
        marginTop: _fontMargin,
      });

      let _values = [];

      if (Array.isArray(line.value)) {
        _values = line.value;
      } else {
        _values = [line.value];
      }

      _values.forEach((value) => {
        this.setText(line.price ? this.prettyPrice(value) : value, {
          colorCode: "secondary",
          color: this.options.style.header.secondaryColor,
          marginTop: _fontMargin,
        });
      });
    });
  }

  /**
   * Generates customer and seller
   *
   * @private
   * @return void
   */
  generateDetails(type) {
    let _maxWidth = 250;
    let _fontMargin = 4;

    this.setCursor("y", this.options.style.header.height + 18);

    // Use a different left position
    if (type === "customer") {
      this.setCursor("x", this.options.style.document.marginLeft);
    } else {
      this.setCursor("x", this.options.style.header.textPosition);
    }

    this.options.data.invoice[type].forEach((line) => {
      this.setText(`${line.label}:`, {
        colorCode: "primary",
        fontWeight: "bold",
        marginTop: 8,
        maxWidth: _maxWidth,
      });

      let _values = [];

      if (Array.isArray(line.value)) {
        _values = line.value;
      } else {
        _values = [line.value];
      }

      _values.forEach((value) => {
        this.setText(value, {
          colorCode: "secondary",
          marginTop: _fontMargin,
          maxWidth: _maxWidth,
        });
      });
    });

    this.storage[type].height = this.storage.cursor.y;
  }

  /**
   * Generates a row
   *
   * @private
   * @param  {string} type
   * @param  {array} columns
   * @return void
   */
  generateTableRow(type, columns) {
    let _fontWeight = "normal",
      _colorCode = "secondary";

    this.storage.cursor.y += 17;

    if (type === "header") {
      _fontWeight = "bold";
      _colorCode = "primary";
    }

    let _maxY = this.storage.cursor.y;
    const colNames = ["item", "quantity", "rate", "amount"];
    columns.forEach((column, index) => {
      let _value;
      let colName = colNames[index];
      this.setCursor("x", this.options.style.table[colName].position);
      _value = column.value;

      if (column.price === true) {
        _value = this.prettyPrice(_value);
      }

      this.setText(_value, {
        colorCode: _colorCode,
        maxWidth: this.options.style.table[colName].maxWidth,
        fontWeight: _fontWeight,
        skipDown: true,
        onNewPageAdded: () => (_maxY = this.storage.cursor.y),
      });
      // Increase y position in case of a line return
      if (this.document.y >= _maxY) {
        _maxY = this.document.y;
      }
    });

    // Set y to the max y position
    this.setCursor("y", _maxY);

    if (type === "header") {
      this.generateLine();
    }
  }

  /**
   * Generates a line separator
   *
   * @private
   * @return void
   */
  generateLine() {
    this.storage.cursor.y += this.options.style.text.regularSize + 2;

    this.document
      .strokeColor("#F0F0F0")
      .lineWidth(1)
      .moveTo(this.options.style.document.marginRight, this.storage.cursor.y)
      .lineTo(
        this.document.page.width - this.options.style.document.marginRight,
        this.storage.cursor.y
      )
      .stroke();
  }

  /**
   * Generates invoice parts
   *
   * @private
   * @return void
   */
  generateParts() {
    let _startY = Math.max(
      this.storage.customer.height,
      this.storage.seller.height
    );

    let _fontMargin = 4;
    let _leftMargin = 15;

    this.setCursor("y", _startY);

    this.setText("\n");

    this.generateTableRow("header", this.options.data.invoice.details.header);

    (this.options.data.invoice.details.parts || []).forEach((part) => {
      this.generateTableRow("row", part);
    });

    this.storage.cursor.y += 50;

    (this.options.data.invoice.details.total || []).forEach((total) => {
      let _value = total.value;

      this.setCursor("x", this.options.style.total.label.position);
      this.setText(total.label, {
        colorCode: "primary",
        fontWeight: "bold",
        marginTop: 12,
        maxWidth: this.options.style.total.label.maxWidth,
        skipDown: true,
      });

      this.setCursor("x", this.options.style.total.content.position);

      if (total.price === true) {
        _value = this.prettyPrice(total.value, total?.digits);
      }

      this.setText(_value, {
        colorCode: "secondary",
        maxWidth: this.options.style.total.content.maxWidth,
      });
    });
  }

  /**
   * Generates legal terms
   *
   * @private
   * @return void
   */
  generateLegal() {
    this.document.page.margins.bottom = 10;
    const legalCursorY = this.document.page.maxY() - 30;
    if (this.storage.cursor.y > legalCursorY) {
      this.document.addPage();
    }

    this.storage.cursor.y = legalCursorY;

    (this.options.data.invoice.legal || []).forEach((legal) => {
      this.setCursor("x", this.options.style.document.marginLeft);

      this.setText(legal.value, {
        maxWidth:
          this.document.page.width - this.options.style.document.marginLeft * 2,
        fontWeight: legal.weight,
        colorCode: legal.color || "primary",
        align: legal.align || "center",
      });
    });
  }

  /**
   * Moves the internal cursor
   *
   * @private
   * @param  {string} axis
   * @param  {number} value
   * @return void
   */
  setCursor(axis, value) {
    this.storage.cursor[axis] = value;
  }

  /**
   * Convert numbers to fixed value and adds currency
   *
   * @private
   * @param  {string | number} value
   * @return string
   */
  prettyPrice(value, numberOfDecimals = 2) {
    let prettifiedValue = value;
    if (!isNaN(value)) {
      prettifiedValue = Number(value).toFixed(numberOfDecimals);
    }

    if (this.options.data.invoice.currency) {
      return `${this.options.data.invoice.currency}${prettifiedValue}`;
    }

    return prettifiedValue;
  }

  /**
   * Adds text on the invoice with specified optons
   *
   * @private
   * @param  {string} text
   * @param  {object} options
   * @return void
   */
  setText(text, options = {}) {
    let _marginTop = options.marginTop || 0;
    let _maxWidth = options.maxWidth;
    let _textAlign = options.align || "left";

    this.storage.cursor.y += _marginTop;
    this.setTextStyle(text, options);
    const currentSectionHeight = this.document.heightOfString(text, {
      width: _maxWidth,
    });
    if (
      currentSectionHeight + this.storage.cursor.y >
      this.document.page.maxY()
    ) {
      this.document.addPage();
      this.setTextStyle(text, options);
      this.storage.cursor.y = this.options.style.document.marginTop;
      if (options.onNewPageAdded) {
        options.onNewPageAdded();
      }
    }

    this.document.text(text, this.storage.cursor.x, this.storage.cursor.y, {
      align: _textAlign,
      width: _maxWidth,
    });

    let _diff = this.document.y - this.storage.cursor.y;

    this.storage.cursor.y = this.document.y;

    // Do not move down
    if (options.skipDown === true) {
      if (_diff > 0) {
        this.storage.cursor.y -= _diff;
      } else {
        this.storage.cursor.y -= 11.5;
      }
    }
  }

  setTextStyle(text, options) {
    let _fontWeight = options.fontWeight || "normal";
    let _colorCode = options.colorCode || "primary";
    let _fontSize = options.fontSize || "regular";
    let _color = options.color || "";
    let _fontSizeValue = 0;
    if (!_color) {
      if (_colorCode === "primary") {
        this.document.fillColor(this.options.style.text.primaryColor);
      } else {
        this.document.fillColor(this.options.style.text.secondaryColor);
      }
    }

    if (_fontSize === "regular") {
      _fontSizeValue = this.options.style.text.regularSize;
    } else {
      _fontSizeValue = this.options.style.text.headingSize;
    }

    this.document.fillColor(_color);
    this.document.fontSize(_fontSizeValue);
    this.document.font(this.getFont(_fontWeight));
  }

  /**
   * Generates a PDF invoide
   *
   * @public
   * @param  {string|object} output
   * @return Promise
   */
  generate(output) {
    let _stream = null;

    this.document = new PDFDocument({
      size: "A4",
    });

    this.loadCustomFonts();
    this.generateHeader();
    this.generateDetails("customer");
    this.generateDetails("seller");
    this.generateParts();
    this.generateLegal();

    if (typeof output === "string" || (output || {}).type === "file") {
      let _path = "";

      if (typeof output === "string") {
        _path = output;
      } else {
        _path = output.path;
      }

      _stream = fs.createWriteStream(output);

      this.document.pipe(_stream);
      this.document.end();
    } else {
      this.document.end();
      return this.document;
    }

    return new Promise((resolve, reject) => {
      this.document.on("end", () => {
        return resolve();
      });

      this.document.on("error", () => {
        return reject();
      });
    });
  }
};
