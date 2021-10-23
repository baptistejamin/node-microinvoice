"use strict";

const PDFDocument = require("pdfkit");
const path        = require("path");
const fs          = require("fs");
const _merge      = require("lodash.merge");
const getStream   = require("get-stream");

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
      style : {
        document : {
          marginLeft  : 30,
          marginRight : 30,
          marginTop   : 30
        },
        fonts : {
          normal  : {
            name : "Helvetica"
          },
          bold     : {
            name : "Helvetica-Bold"
          },
          fallback : {
            name : "Noto Sans",
            path : path.join(
              __dirname, "../res/fonts/", "NotoSans-Regular.ttf"
            ),
            enabled : true
          }
        },
        header : {
          backgroundColor : "#F8F8FA",
          height          : 150,
          image           : null,
          textPosition    : 370
        },
        table : {
          headerColor : "#F8F8FA"
        },
        text : {
          primaryColor   : "#000100",
          secondaryColor : "#8F8F8F",
          headingSize    : 15,
          regularSize    : 10
        }
      },

      data : {
        invoice : {
          name   : "Invoice for Acme",
          header : [{
            label : "Invoice Number",
            value : 1
          }],
          customer : [{
            label : "Bill To",
            value : []
          }],
          seller : [{
            label : "Bill From",
            value : []
          }],
          details : {
            header : [{
              value : "Description"
            }, {
              value : "Quantity"
            }, {
              value : "Subtotal"
            }],
            parts : [],
            total : [{
              label : "Total",
              value : 0
            }]
          },
          legal : []
        }
      }
    };

    this.options = _merge(this.defaultOptions, options);

    this.storage = {
      header : {
        image : null
      },
      cursor : {
        x : 0,
        y : 0
      },
      customer : {
        height : 0
      },
      seller : {
        height : 0
      },
      fonts : {
        fallback : {
          loaded : false
        }
      },
      document : null
    };

    this.specialCharsRegex = /[^\x00-\xFF]/m;
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
   * @return void
   */
  getFontOrFallback(type, value) {
    if (type !== "normal" && type !== "bold") {
      type = "normal";
    }

    // Return default font
    if (this.options.style.fonts.fallback.enabled === false) {
      return this.options.style.fonts[type].name;
    }

    // Return default font if not special chars are found
    if (!this.specialCharsRegex.test((value || "").toString())) {
      return this.options.style.fonts[type].name;
    }

    if (this.storage.fonts.fallback.loaded === false) {
      this.document.registerFont(
        this.options.style.fonts.fallback.name,
        this.options.style.fonts.fallback.path
      );
      this.storage.fonts.fallback.loaded = true;
    }

    // Return fallback font
    return this.options.style.fonts.fallback.name;
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
      .rect(
        0,
        0,
        this.document.page.width,
        this.options.style.header.height
      )
      .fill(this.options.style.header.backgroundColor);

    // Add an image to the header if any
    if (this.options.style.header.image &&
      this.options.style.header.image.path) {
      this.document.image(
        this.options.style.header.image.path,
        this.options.style.document.marginLeft,
        this.options.style.document.marginTop, {
          width  : this.options.style.header.image.width,
          height : this.options.style.header.image.height
        }
      );
    }

    let _fontMargin = 4;

    // Write header details
    this.setCursor("x", this.options.style.header.textPosition);
    this.setCursor("y", this.options.style.document.marginTop);

    this.setText(this.options.data.invoice.name, {
      fontSize   : "heading",
      fontWeight : "bold",
      color      : this.options.style.header.regularColor
    });

    this.options.data.invoice.header.forEach(line => {
      this.setText(`${line.label}:`, {
        fontWeight : "bold",
        color      : this.options.style.header.regularColor,
        marginTop  : _fontMargin
      });

      let _values = [];

      if (Array.isArray(line.value)) {
        _values = line.value;
      } else {
        _values = [line.value];
      }

      _values.forEach((value) => {
        this.setText(value, {
          colorCode : "secondary",
          color     : this.options.style.header.secondaryColor,
          marginTop : _fontMargin
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
    let _maxWidth   = 250;
    let _fontMargin = 4;

    this.setCursor("y", this.options.style.header.height + 18);

    // Use a different left position
    if (type === "customer") {
      this.setCursor("x", this.options.style.document.marginLeft);
    } else {
      this.setCursor("x", this.options.style.header.textPosition);
    }

    this.options.data.invoice[type].forEach(line => {
      this.setText(`${line.label}:`, {
        colorCode  : "primary",
        fontWeight : "bold",
        marginTop  : 8,
        maxWidth   : _maxWidth
      });

      let _values = [];

      if (Array.isArray(line.value)) {
        _values = line.value;
      } else {
        _values = [line.value];
      }

      _values.forEach((value) => {
        this.setText(value, {
          colorCode : "secondary",
          marginTop : _fontMargin,
          maxWidth  : _maxWidth
        });
      });
    });

    this.storage[type].height = this.storage.cursor.y;
  }

  /**
   * Generates a row
   *
   * @private
   * @return void
   */
  generateTableRow(type, columns) {
    let _fontWeight = "normal";

    this.storage.cursor.y += 17;

    if (type === "header") {
      _fontWeight = "bold";
    }

    let _start    = this.options.style.document.marginLeft;

    // Computes columns withsby giving an extra space for the last column \
    //   It is used to keep a perfect alignement
    let _regularMaxWidth = (
      this.document.page.width -
      _start -
      this.options.style.document.marginRight -
      this.options.style.header.textPosition
    ) / (columns.length - 2);

    let _lastMaxWidth = (
      this.document.page.width -
      this.options.style.header.textPosition -
      this.options.style.document.marginRight
    );

    columns.forEach((column, index) => {
      let _maxWidth = _regularMaxWidth, _value;

      if (index < columns.length - 1) {
        this.setCursor("x", _start);
      } else {
        // Use an extra space for the last column
        _maxWidth = _lastMaxWidth;
        this.setCursor("x", this.options.style.header.textPosition);
      }

      _value = column.value;

      if (column.price === true) {
        _value = this.prettyPrice(_value);
      }

      this.setText(_value, {
        colorCode  : "primary",
        maxWidth   : _maxWidth,
        fontWeight : _fontWeight,
        skipDown   : true
      });

      _start += _maxWidth + 10;
    });

    let _initialY = this.storage.cursor.y;

    if (type === "header") {
      this.generateLine();
    }

    this.setCursor("y", _initialY);
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
      .moveTo(
        this.options.style.document.marginRight,
        this.storage.cursor.y
      )
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
    let _startY     = Math.max(
      this.storage.customer.height, this.storage.seller.height
    );

    let _fontMargin = 4;
    let _leftMargin = 15;
    let _topMargin = 15;

    this.setCursor("y", _startY + _topMargin);

    this.generateTableRow("header", this.options.data.invoice.details.header);

    (this.options.data.invoice.details.parts || []).forEach(part => {
      this.generateTableRow("row", part);
    });

    this.storage.cursor.y += 50;

    let _maxWidth = (
      this.document.page.width -
      this.options.style.header.textPosition -
      this.options.style.document.marginRight
    );

    (this.options.data.invoice.details.total || []).forEach(total => {
      let _mainRatio   = 0.6, _secondaryRatio = 0.3;
      let _margin      = 30;
      let _value       = total.value;

      this.setCursor("x", this.options.style.header.textPosition);
      this.setText(total.label, {
        colorCode  : "primary",
        fontWeight : "bold",
        marginTop  : 12,
        maxWidth   : _maxWidth * _mainRatio,
        skipDown   : true
      });

      this.setCursor("x", (
        this.options.style.header.textPosition +
        (_maxWidth * _mainRatio) + _margin
      ));

      if (total.price === true) {
        _value = this.prettyPrice(total.value);
      }

      this.setText(_value, {
        colorCode : "secondary",
        maxWidth  : _maxWidth * _secondaryRatio
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
    this.storage.cursor.y += 60;

    (this.options.data.invoice.legal || []).forEach(legal => {
      this.setCursor("x", this.options.style.document.marginLeft * 2);

      this.setText(legal.value, {
        fontWeight : legal.weight,
        colorCode  : legal.color || "primary",
        align      : "center",
        marginTop  : 10
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
  prettyPrice(value) {
    if (typeof value === "number") {
      value = value.toFixed(2);
    }

    if (this.options.data.invoice.currency) {
      value = `${value} ${this.options.data.invoice.currency}`;
    }

    return value;
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
    let _fontWeight    = options.fontWeight || "normal";
    let _colorCode     = options.colorCode  || "primary";
    let _fontSize      = options.fontSize   || "regular";
    let _textAlign     = options.align      || "left";
    let _color         = options.color      || "";
    let _marginTop     = options.marginTop  || 0;
    let _maxWidth      = options.maxWidth;
    let _fontSizeValue = 0;

    this.storage.cursor.y += _marginTop;

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

    this.getFontOrFallback(_fontWeight, text);

    this.document.font(this.getFontOrFallback(_fontWeight, text));

    this.document.fillColor(_color);
    this.document.fontSize(_fontSizeValue);

    this.document.text(
      text,
      this.storage.cursor.x,
      this.storage.cursor.y, {
        align : _textAlign,
        width : _maxWidth
      }
    );

    // Do not move down
    if (options.skipDown !== true) {
      this.storage.cursor.y = this.document.y;
    }
  }

  /**
   * Generates a PDF invoide
   *
   * @public
   * @param  {string|object} output
   * @return Promise
   */
  generate(output) {
    let _stream    = null;

    this.document = new PDFDocument({
      size : "A4"
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
      return getStream.buffer(this.document);
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
