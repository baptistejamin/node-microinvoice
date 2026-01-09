/*
 * microinvoice
 *
 * Copyright 2025, Baptiste Jamin
 * Author: Baptiste Jamin <baptiste@crisp.chat>
 */

/**************************************************************************
 * IMPORTS
 ***************************************************************************/

// NPM
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import _merge from "lodash.merge";
import { transliterate } from "transliteration";
import type PDFKit from "pdfkit";

// PROJECT: LIB
import {
  generateFacturXML,
  embedFacturX,
  calculateTotals,
  formatPartyAddress,
  validateInvoice,
  safeValidateInvoice
} from "./facturx/index.js";
import type { FacturXOptions } from "./facturx/types.js";
import type { InvoiceData, InvoiceDataInput } from "./facturx/schema.js";

// Re-export Factur-X schema (preferred unified API)
export {
  // Schemas
  AddressSchema,
  PartySchema,
  LineItemSchema,
  PaymentSchema,
  InvoiceMetaSchema,
  LegalNoticeSchema,
  InvoiceDataSchema,

  // Output types (with official codes)
  type Address,
  type Party,
  type LineItem,
  type Payment,
  type InvoiceMeta,
  type LegalNotice,
  type InvoiceData,
  type InvoiceTotals,
  type UnitCode,

  // Input types (with friendly names)
  type VATCategoryInput,
  type InvoiceTypeInput,
  type PaymentMeansInput,
  type UnitCodeInput,
  type LineItemInput,
  type InvoiceDataInput,

  // Helpers
  validateInvoice,
  safeValidateInvoice,
  formatPartyAddress,

  // Constants with friendly names
  VAT_CATEGORIES,
  INVOICE_TYPES,
  PAYMENT_MEANS,
  UNIT_CODES,
  LEGAL_ID_SCHEMES,
  type LegalIdScheme,

  // Labels for display
  VAT_CATEGORY_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_MEANS_LABELS,
  UNIT_CODE_LABELS,

  // Legacy constant names
  VAT_CATEGORY_CODES,
  INVOICE_TYPE_CODES,
  PAYMENT_MEANS_CODES
} from "./facturx/schema.js";

// Re-export legacy types (for backward compatibility)
export type {
  VATCategoryCode,
  InvoiceTypeCode,
  PaymentMeansCode,
  FacturXAddress,
  FacturXParty,
  FacturXLineItem,
  FacturXPayment,
  FacturXInvoice,
  FacturXOptions,
  FacturXTotals
} from "./facturx/types.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MicroinvoiceFont {
  name: string;
  path?: string;
  range?: RegExp;
  enabled?: boolean;
  transliterate?: boolean;
}

interface MicroinvoiceImage {
  path: string;
  width: number;
  height: number;
}

interface MicroinvoiceHeader {
  backgroundColor?: string;
  height?: number;
  image?: MicroinvoiceImage;
  textPosition?: number;
  regularColor?: string;
  secondaryColor?: string;
}

interface MicroinvoicePart {
  label?: string;
  value: string | number | string[];
  price?: boolean;
  weight?: string;
  color?: string;
}

interface MicroinvoiceTextOptions {
  fontWeight?: string;
  colorCode?: string;
  fontSize?: string;
  align?: string;
  color?: string;
  marginTop?: number;
  maxWidth?: number;
  skipDown?: boolean;
}

interface MicroinvoiceOutputOptions {
  type: "file";
  path: string;
}

type MicroinvoiceOutput = string | MicroinvoiceOutputOptions | undefined;

interface MicroinvoiceOptions {
  style?: {
    document?: {
      marginLeft: number;
      marginRight: number;
      marginTop: number;
    };

    header?: MicroinvoiceHeader;

    fonts?: {
      normal?: MicroinvoiceFont;
      bold?: MicroinvoiceFont;
      fallback?: MicroinvoiceFont;
    };

    table?: {
      quantity: {
        position: number;
        maxWidth: number;
      };
      total: {
        position: number;
        maxWidth: number;
      };
    };

    text?: {
      primaryColor?: string;
      secondaryColor?: string;
      headingSize?: number;
      regularSize?: number;
    };
  };

  /**
   * Legacy data format for visual PDF generation.
   * Prefer using `invoiceData` for unified configuration with Zod validation.
   */
  data?: {
    invoice: {
      name: string;
      header: MicroinvoicePart[];
      customer: MicroinvoicePart[];
      seller: MicroinvoicePart[];
      details: {
        header?: MicroinvoicePart[];
        parts?: MicroinvoicePart[][];
        total?: MicroinvoicePart[];
      };
      legal?: MicroinvoicePart[];
      currency?: string;
    };
  };

  /**
   * Legacy Factur-X configuration (used with `data`).
   * Prefer using `invoiceData` for unified configuration.
   */
  facturx?: FacturXOptions;

  /**
   * Unified invoice data with Zod validation.
   * Single source of truth for both visual PDF and Factur-X XML generation.
   * When provided, this takes precedence over `data` and `facturx`.
   */
  invoiceData?: InvoiceDataInput;
}

interface MicroinvoiceStorage {
  header: {
    image: MicroinvoiceImage | null;
  };
  cursor: {
    x: number;
    y: number;
  };
  customer: {
    height: number;
  };
  seller: {
    height: number;
  };
  fonts: {
    fallback: {
      loaded: boolean;
    };
  };
  document: PDFKit.PDFDocument | null;
}

/**
 * Invoice
 * This is the constructor that creates a new instance containing the needed
 * methods.
 *
 * @name Microinvoice
 */
export default class Microinvoice {
  private defaultOptions: MicroinvoiceOptions;
  private options: MicroinvoiceOptions;
  private document: PDFKit.PDFDocument;
  private storage: MicroinvoiceStorage;

  /**
   * Constructor
   */
  constructor(options?: MicroinvoiceOptions) {
    this.defaultOptions = {
      style: {
        document: {
          marginLeft: 30,
          marginRight: 30,
          marginTop: 30
        },

        fonts: {
          normal: {
            name: "Helvetica",
            range: /[^\u0000-\u00FF]/m
          },
          bold: {
            name: "Helvetica-Bold"
          },
          fallback: {
            name: "Noto Sans",
            path: path.join(
              __dirname, "../res/fonts/", "NotoSans-Regular.ttf"
            ),
            enabled: true,
            range: /[^\u0000-\u0500]/m,
            transliterate: true
          }
        },
        header: {
          backgroundColor: "#F8F8FA",
          height: 150,
          image: null,
          textPosition: 330
        },
        table: {
          quantity: {
            position: 330,
            maxWidth: 140
          },
          total: {
            position: 490,
            maxWidth: 80
          }
        },
        text: {
          primaryColor: "#000100",
          secondaryColor: "#8F8F8F",
          headingSize: 15,
          regularSize: 10
        }
      },

      data: {
        invoice: {
          name: "Invoice for Acme",
          header: [{
            label: "Invoice Number",
            value: 1
          }],
          customer: [{
            label: "Bill To",
            value: []
          }],
          seller: [{
            label: "Bill From",
            value: []
          }],
          details: {
            header: [{
              value: "Description"
            }, {
              value: "Quantity"
            }, {
              value: "Subtotal"
            }],
            parts: [],
            total: [{
              label: "Total",
              value: 0
            }]
          },
          legal: []
        }
      }
    };

    // If unified invoiceData is provided, convert it to internal format
    if (options?.invoiceData) {
      const converted = this.convertInvoiceData(options.invoiceData);

      options = {
        ...options,
        data: converted.data,
        facturx: converted.facturx
      };
    }

    this.options = _merge(this.defaultOptions, options);

    this.storage = {
      header: {
        image: null
      },
      cursor: {
        x: 0,
        y: 0
      },
      customer: {
        height: 0
      },
      seller: {
        height: 0
      },
      fonts: {
        fallback: {
          loaded: false
        }
      },
      document: null
    };
  }

  /**
   * Convert unified InvoiceDataInput to internal format
   * Validates and transforms the input using Zod schema
   */
  private convertInvoiceData(input: InvoiceDataInput): {
    data: MicroinvoiceOptions["data"];
    facturx?: FacturXOptions;
  } {
    // Parse and validate input, applying defaults and transformations
    const invoiceData = validateInvoice(input);
    const totals = calculateTotals(invoiceData.lineItems);

    // Format date for display
    const formatDisplayDate = (date: Date): string => {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit"
      });
    };

    // Build header info
    const header: MicroinvoicePart[] = [
      { label: "Invoice Number", value: invoiceData.invoice.number },
      { label: "Date", value: formatDisplayDate(invoiceData.invoice.issueDate) }
    ];

    if (invoiceData.invoice.dueDate) {
      header.push({
        label: "Due Date",
        value: formatDisplayDate(invoiceData.invoice.dueDate)
      });
    }

    // Build customer (buyer) info
    const customer: MicroinvoicePart[] = [
      {
        label: "Bill To",
        value: formatPartyAddress(invoiceData.buyer)
      }
    ];

    if (invoiceData.buyer.vatId) {
      customer.push({ label: "Tax Identifier", value: invoiceData.buyer.vatId });
    }

    // Build seller info
    const seller: MicroinvoicePart[] = [
      {
        label: "Bill From",
        value: formatPartyAddress(invoiceData.seller)
      }
    ];

    if (invoiceData.seller.vatId) {
      seller.push({ label: "Tax Identifier", value: invoiceData.seller.vatId });
    }

    if (invoiceData.seller.legalId) {
      const schemeLabels: Record<string, string> = {
        // Austria
        firmenbuch: "Firmenbuch",
        uid_at: "UID",
        // Belgium
        bce: "BCE/KBO",
        kbo: "BCE/KBO",
        // Bulgaria
        bulstat: "BULSTAT",
        // Croatia
        oib: "OIB",
        mbs: "MBS",
        // Cyprus
        cyprus_reg: "Reg. No.",
        // Czech Republic
        ico: "IČO",
        // Denmark
        cvr: "CVR",
        // Estonia
        ariregister: "Äriregister",
        // Finland
        ytunnus: "Y-tunnus",
        ovt: "OVT",
        // France
        siret: "SIRET",
        siren: "SIREN",
        // Germany
        handelsregister: "Handelsregister",
        ust_id_nr: "USt-IdNr",
        // Greece
        gemi: "GEMI",
        // Hungary
        cegjegyzek: "Cégjegyzék",
        // Ireland
        cro: "CRO",
        // Italy
        rea: "REA",
        codice_fiscale: "Codice Fiscale",
        // Latvia
        ur_lv: "Reg. Nr.",
        // Lithuania
        rc_lt: "Juridinio kodas",
        // Luxembourg
        rcs_lu: "RCS",
        // Malta
        mfsa: "MFSA",
        // Netherlands
        kvk: "KVK",
        // Poland
        krs: "KRS",
        regon: "REGON",
        nip: "NIP",
        // Portugal
        nipc: "NIPC",
        // Romania
        cui: "CUI",
        // Slovakia
        ico_sk: "IČO",
        // Slovenia
        maticna: "Matična št.",
        // Spain
        nif: "NIF",
        // Sweden
        orgnr: "Org.nr",
        // UK
        companies_house: "Companies House",
        // Switzerland
        uid_ch: "UID",
        // Norway
        orgnr_no: "Org.nr",
        // International
        eori: "EORI",
        gln: "GLN",
        duns: "D-U-N-S",
        lei: "LEI",
        vat: "VAT"
      };

      const label = schemeLabels[invoiceData.seller.legalId.scheme] || "Company ID";

      seller.push({ label, value: invoiceData.seller.legalId.value });
    }

    // Build line items
    const parts: MicroinvoicePart[][] = invoiceData.lineItems.map((item) => [
      { value: item.description },
      { value: item.quantity },
      { value: item.quantity * item.unitPrice, price: true }
    ]);

    // Build totals
    const total: MicroinvoicePart[] = [
      { label: "Total without VAT", value: totals.netAmount, price: true }
    ];

    // Add VAT breakdown
    for (const vat of totals.vatBreakdown) {
      total.push({ label: `VAT ${vat.rate}%`, value: vat.vatAmount, price: true });
    }

    total.push({ label: "Total with VAT", value: totals.grossAmount, price: true });

    // Build legal notices
    const legal: MicroinvoicePart[] = (invoiceData.legal || []).map((notice) => ({
      value: notice.text,
      weight: notice.weight,
      color: "secondary"
    }));

    const data: MicroinvoiceOptions["data"] = {
      invoice: {
        name: invoiceData.title,
        header,
        customer,
        seller,
        details: {
          header: [
            { value: "Description" },
            { value: "Quantity" },
            { value: "Subtotal" }
          ],
          parts,
          total
        },
        legal,
        currency: invoiceData.invoice.currencyCode
      }
    };

    // Build Factur-X options if enabled
    let facturx: FacturXOptions | undefined;

    if (invoiceData.facturx) {
      facturx = {
        enabled: true,
        seller: invoiceData.seller,
        buyer: invoiceData.buyer,
        invoice: invoiceData.invoice,
        lineItems: invoiceData.lineItems as FacturXOptions["lineItems"],
        payment: invoiceData.payment as FacturXOptions["payment"]
      };
    }

    return { data, facturx };
  }

  /**
   * Generates a PDF invoice
   *
   * @public
   * @param  {string|object} output
   * @return Promise
   */
  generate(output: string | MicroinvoiceOutputOptions): Promise<void>;
  /**
   * Generates a PDF invoice
   */
  generate(output?: undefined): PDFKit.PDFDocument;
  /**
   * Generates a PDF invoice
   */
  generate(output?: MicroinvoiceOutput): Promise<void> | PDFKit.PDFDocument {
    this.document = new PDFDocument({
      size: "A4"
    });

    this.loadCustomFonts();
    this.generateHeader();
    this.generateDetails("customer");
    this.generateDetails("seller");
    this.generateParts();
    this.generateLegal();

    // Handle Factur-X enabled output (always async, requires file path)
    if (this.options.facturx?.enabled) {
      if (typeof output !== "string" && output?.type !== "file") {
        throw new Error("Factur-X generation requires a file output path");
      }

      const filePath = (typeof output === "string") ? output : output.path;

      return this.generateFacturXPDF(filePath);
    }

    // Standard PDF output
    if (typeof output === "string" || (output?.type === "file")) {
      const filePath = (typeof output === "string") ? output : output.path;
      const _stream = fs.createWriteStream(filePath);

      this.document.pipe(_stream);
      this.document.end();
    } else {
      this.document.end();

      return this.document;
    }

    return new Promise((resolve, reject) => {
      this.document.on("end", () => {
        return resolve(void 0);
      });

      this.document.on("error", () => {
        return reject();
      });
    });
  }

  /**
   * Generates a Factur-X compliant PDF with embedded XML
   */
  private async generateFacturXPDF(filePath: string): Promise<void> {
    // Generate PDF to buffer first
    const pdfBuffer = await this.generateToBuffer();

    // Generate CII XML - use unified invoiceData if available, otherwise legacy facturx
    let xmlContent: string;

    if (this.options.invoiceData) {
      // Parse and validate input before generating XML
      const validatedData = validateInvoice(this.options.invoiceData);

      xmlContent = generateFacturXML(validatedData);
    } else {
      // Convert legacy FacturXOptions to InvoiceData format
      const facturxInvoice = this.options.facturx!.invoice;

      const legacyData: InvoiceData = {
        title: this.options.data?.invoice?.name || "Invoice",
        invoice: {
          ...facturxInvoice,
          typeCode: (facturxInvoice.typeCode || "380") as InvoiceData["invoice"]["typeCode"]
        },
        seller: this.options.facturx!.seller,
        buyer: this.options.facturx!.buyer,
        lineItems: this.options.facturx!.lineItems as InvoiceData["lineItems"],
        payment: this.options.facturx!.payment as InvoiceData["payment"],
        facturx: true
      };

      xmlContent = generateFacturXML(legacyData);
    }

    // Embed XML into PDF and add PDF/A-3 metadata
    const facturxPdf = await embedFacturX(
      pdfBuffer,
      xmlContent,
      "EN16931",
      this.options.data?.invoice?.name || "Invoice"
    );

    // Write the final Factur-X PDF to disk
    fs.writeFileSync(filePath, facturxPdf);
  }

  /**
   * Generates PDF to a Uint8Array (used for Factur-X processing)
   */
  private generateToBuffer(): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      this.document.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      this.document.on("end", () => {
        // Calculate total length
        let totalLength = 0;

        for (const chunk of chunks) {
          totalLength += chunk.length;
        }

        // Concatenate all chunks
        const result = new Uint8Array(totalLength);

        let offset = 0;

        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        resolve(result);
      });

      this.document.on("error", (error: Error) => {
        reject(error);
      });

      this.document.end();
    });
  }

  /**
   * Load custom fonts
   */
  private loadCustomFonts() {
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
   */
  private getFontOrFallback(type: "normal" | "bold", value: string): string {
    let _normalRange   = this.options.style.fonts.normal.range;
    let _fallbackRange = this.options.style.fonts.fallback.range;

    if (type !== "normal" && type !== "bold") {
      type = "normal";
    }

    // Return default font
    if (this.options.style.fonts.fallback.enabled === false) {
      return this.options.style.fonts[type].name;
    }

    // Return default font if not special chars are found
    if (!_normalRange.test((value || "").toString())) {
      return this.options.style.fonts[type].name;
    }

    // Return default font if fallback font if range not supported
    if (_fallbackRange.test((value || "").toString())) {
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
   * Show value or transliterate
   */
  private valueOrTransliterate(value: string): string {
    let _fallbackRange = this.options.style.fonts.fallback.range;

    // Return default font
    if (this.options.style.fonts.fallback.enabled === false) {
      return value;
    }

    // Return default font if not special chars are found
    if (!_fallbackRange.test((value || "").toString())) {
      return value;
    }

    return transliterate(value);
  }

  /**
   * Generates the header
    *
   * @private
   * @return void
   */
  private generateHeader() {
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
    if (this.options?.style?.header?.image?.path) {
      this.document.image(
        this.options.style.header.image.path,
        this.options.style.document.marginLeft,
        this.options.style.document.marginTop, {
          width: this.options.style.header.image.width,
          height: this.options.style.header.image.height
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
      color: this.options.style.header.regularColor
    });

    this.options.data.invoice.header.forEach((line) => {
      if (!line.value) {
        return;
      }

      this.setText(`${line.label}:`, {
        fontWeight: "bold",
        color: this.options.style.header.regularColor,
        marginTop: _fontMargin
      });

      let _values = [];

      if (Array.isArray(line.value)) {
        _values = line.value;
      } else {
        _values = [line.value];
      }

      _values.forEach((value) => {
        if (!value) {
          return;
        }

        this.setText(value, {
          colorCode: "secondary",
          color: this.options.style.header.secondaryColor,
          marginTop: _fontMargin
        });
      });
    });
  }

  /**
   * Generates customer and seller
   */
  private generateDetails(type: "customer" | "seller") {
    let _maxWidth   = 250;
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
        maxWidth: _maxWidth
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
          maxWidth: _maxWidth
        });
      });
    });

    this.storage[type].height = this.storage.cursor.y;
  }

  /**
   * Generates a row
   */
  private generateTableRow(type: "header" | "row", columns: MicroinvoicePart[]) {
    let _fontWeight = "normal", _colorCode = "secondary";

    this.storage.cursor.y = this.document.y;

    this.storage.cursor.y += 17;

    if (type === "header") {
      _fontWeight = "bold";
      _colorCode = "primary";
    }

    let _start    = this.options.style.document.marginLeft;
    let _maxY     = this.storage.cursor.y;

    // Computes columns by giving an extra space for the last column \
    //   It is used to keep a perfect alignement
    let _maxWidth = (
      this.options.style.header.textPosition -
      _start -
      this.options.style.document.marginRight
    ) / (columns.length - 2);

    columns.forEach((column, index) => {
      let _value;

      if (index < columns.length - 2) {
        this.setCursor("x", _start);
      } else {
        if (index === columns.length - 2) {
          _maxWidth = this.options.style.table.quantity.maxWidth;
          this.setCursor("x", this.options.style.table.quantity.position);
        } else {
          _maxWidth = this.options.style.table.total.maxWidth;
          this.setCursor("x", this.options.style.table.total.position);
        }
      }

      _value = column.value;

      if (column.price === true) {
        _value = this.prettyPrice(_value);
      }

      this.setText(_value, {
        colorCode: _colorCode,
        maxWidth: _maxWidth,
        fontWeight: _fontWeight,
        skipDown: true
      });

      _start += _maxWidth + 10;

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
   */
  private generateLine() {
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
   */
  private generateParts() {
    let _startY     = Math.max(
      this.storage.customer.height, this.storage.seller.height
    );

    this.setCursor("y", _startY);

    this.setText("\n");

    this.generateTableRow("header", this.options.data.invoice.details.header);

    this.options.data.invoice.details.parts?.forEach((part) => {
      this.generateTableRow("row", part);
    });

    this.storage.cursor.y += 50;

    this.options.data.invoice.details.total?.forEach((total) => {
      let _value: string | number | string[] = total.value;

      this.setCursor("x", this.options.style.table.quantity.position);
      this.setText(String(total.label ?? ""), {
        colorCode: "primary",
        fontWeight: "bold",
        marginTop: 12,
        maxWidth: this.options.style.table.quantity.maxWidth,
        skipDown: true
      });

      this.setCursor("x", this.options.style.table.total.position);

      if (total.price === true) {
        _value = this.prettyPrice(total.value);
      }

      this.setText(String(_value), {
        colorCode: "secondary",
        maxWidth: this.options.style.table.total.maxWidth
      });
    });
  }

  /**
   * Generates legal terms
   */
  private generateLegal() {
    this.storage.cursor.y += 60;

    this.options.data.invoice.legal?.forEach((legal) => {
      if (!legal.value) {
        return;
      }

      this.setCursor("x", this.options.style.document.marginLeft * 2);

      this.setText(String(legal.value), {
        fontWeight: legal.weight,
        colorCode: legal.color || "primary",
        align: "center",
        marginTop: 10
      });
    });
  }

  /**
   * Moves the internal cursor
   */
  private setCursor(axis: "x" | "y", value: number) {
    this.storage.cursor[axis] = value;
  }

  /**
   * Convert numbers to fixed value and adds currency
   */
  private prettyPrice(value: string | number | string[]): string {
    if (Array.isArray(value)) {
      value = value.join(", ");
    } else if (typeof value === "number") {
      value = value.toFixed(2);
    }

    if (this.options.data.invoice.currency) {
      value = `${value} ${this.options.data.invoice.currency}`;
    }

    return value;
  }

  /**
   * Adds text on the invoice with specified optons
   */
  private setText(text: string, options: MicroinvoiceTextOptions = {}) {
    let _fontWeight: "normal" | "bold" = (options.fontWeight === "bold") ? "bold" : "normal";
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

    this.document.font(this.getFontOrFallback(_fontWeight, text));

    this.document.fillColor(_color);
    this.document.fontSize(_fontSizeValue);

    this.document.text(
      this.valueOrTransliterate(text),
      this.storage.cursor.x,
      this.storage.cursor.y, {
        align: _textAlign,
        width: _maxWidth
      }
    );

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
};
