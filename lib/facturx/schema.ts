/*
 * microinvoice - Zod Schemas for Invoice Validation
 *
 * Copyright 2025, Baptiste Jamin
 * Author: Baptiste Jamin <baptiste@crisp.chat>
 *
 * Unified schema for both visual PDF and Factur-X XML generation.
 * EN16931 compliant validation.
 */

// NPM
import { z } from "zod";

/**************************************************************************
 * CONSTANTS & MAPPINGS
 ***************************************************************************/

/**
 * VAT category codes according to UNCL5305
 * Maps friendly names to official codes
 */
export const VAT_CATEGORIES = {
  // Friendly names → codes
  standard: "S",
  zero: "Z",
  exempt: "E",
  reverse_charge: "AE",
  intra_community: "K",
  export: "G",
  not_subject: "O",
  canary_islands: "L",
  ceuta_melilla: "M",

  // Also accept raw codes
  S: "S",
  Z: "Z",
  E: "E",
  AE: "AE",
  K: "K",
  G: "G",
  O: "O",
  L: "L",
  M: "M"
} as const;

export const VAT_CATEGORY_LABELS = {
  S: "Standard rate",
  Z: "Zero rated goods",
  E: "Exempt from tax",
  AE: "Reverse charge (VAT due by buyer)",
  K: "Intra-community supply",
  G: "Export outside the EU",
  O: "Not subject to VAT",
  L: "Canary Islands general indirect tax",
  M: "Tax for production, services and importation in Ceuta and Melilla"
} as const;

/**
 * Invoice type codes according to UNTDID 1001
 * Maps friendly names to official codes
 */
export const INVOICE_TYPES = {
  // Friendly names → codes
  invoice: "380",
  credit_note: "381",
  corrected: "384",
  self_billed: "389",

  // Also accept raw codes
  380: "380",
  381: "381",
  384: "384",
  389: "389"
} as const;

export const INVOICE_TYPE_LABELS = {
  380: "Commercial Invoice",
  381: "Credit Note",
  384: "Corrected Invoice",
  389: "Self-billed Invoice"
} as const;

/**
 * Payment means codes according to UNTDID 4461
 * Maps friendly names to official codes
 */
export const PAYMENT_MEANS = {
  // Friendly names → codes
  transfer: "30",
  credit_transfer: "30",
  debit_transfer: "31",
  bank_account: "42",
  card: "48",
  bank_card: "48",
  direct_debit: "49",
  standing_agreement: "57",
  sepa: "58",
  sepa_transfer: "58",

  // Also accept raw codes
  30: "30",
  31: "31",
  42: "42",
  48: "48",
  49: "49",
  57: "57",
  58: "58"
} as const;

export const PAYMENT_MEANS_LABELS = {
  30: "Credit transfer",
  31: "Debit transfer",
  42: "Payment to bank account",
  48: "Bank card",
  49: "Direct debit",
  57: "Standing agreement",
  58: "SEPA credit transfer"
} as const;

/**
 * Common unit codes according to UN/ECE Recommendation 20
 * Maps friendly names to official codes
 */
export const UNIT_CODES = {
  // Friendly names → codes
  unit: "C62",
  piece: "C62",
  each: "EA",
  hour: "HUR",
  day: "DAY",
  month: "MON",
  kg: "KGM",
  kilogram: "KGM",
  meter: "MTR",
  metre: "MTR",
  liter: "LTR",
  litre: "LTR",
  sqm: "MTK",
  square_meter: "MTK",

  // Also accept raw codes
  C62: "C62",
  EA: "EA",
  HUR: "HUR",
  DAY: "DAY",
  MON: "MON",
  KGM: "KGM",
  MTR: "MTR",
  LTR: "LTR",
  MTK: "MTK"
} as const;

export const UNIT_CODE_LABELS = {
  C62: "One (unit)",
  EA: "Each",
  HUR: "Hour",
  DAY: "Day",
  MON: "Month",
  KGM: "Kilogram",
  MTR: "Metre",
  LTR: "Litre",
  MTK: "Square metre"
} as const;

/**************************************************************************
 * SMART SCHEMAS WITH AUTO-CONVERSION
 ***************************************************************************/

// Output types (official codes)
export type VATCategoryCode = "S" | "Z" | "E" | "AE" | "K" | "G" | "O" | "L" | "M";
export type InvoiceTypeCode = "380" | "381" | "384" | "389";
export type PaymentMeansCode = "30" | "31" | "42" | "48" | "49" | "57" | "58";
export type UnitCode = "C62" | "EA" | "HUR" | "DAY" | "MON" | "KGM" | "MTR" | "LTR" | "MTK";

/**
 * VAT category schema - accepts friendly names or codes, outputs code
 * Examples: "standard" → "S", "S" → "S", "reverse_charge" → "AE"
 */
const VATCategorySchema = z.union([
  z.enum(["standard", "zero", "exempt", "reverse_charge", "intra_community", "export", "not_subject", "canary_islands", "ceuta_melilla"]),
  z.enum(["S", "Z", "E", "AE", "K", "G", "O", "L", "M"])
]).transform((val): VATCategoryCode => VAT_CATEGORIES[val] as VATCategoryCode);

/**
 * Invoice type schema - accepts friendly names or codes, outputs code
 * Examples: "invoice" → "380", "credit_note" → "381", "380" → "380"
 */
const InvoiceTypeSchema = z.union([
  z.enum(["invoice", "credit_note", "corrected", "self_billed"]),
  z.enum(["380", "381", "384", "389"])
]).transform((val): InvoiceTypeCode => INVOICE_TYPES[val] as InvoiceTypeCode);

/**
 * Payment means schema - accepts friendly names or codes, outputs code
 * Examples: "sepa" → "58", "card" → "48", "30" → "30"
 */
const PaymentMeansSchema = z.union([
  z.enum(["transfer", "credit_transfer", "debit_transfer", "bank_account", "card", "bank_card", "direct_debit", "standing_agreement", "sepa", "sepa_transfer"]),
  z.enum(["30", "31", "42", "48", "49", "57", "58"])
]).transform((val): PaymentMeansCode => PAYMENT_MEANS[val] as PaymentMeansCode);

/**
 * Unit code schema - accepts friendly names or codes, outputs code
 * Examples: "hour" → "HUR", "unit" → "C62", "DAY" → "DAY"
 */
const UnitCodeSchema = z.union([
  z.enum(["unit", "piece", "each", "hour", "day", "month", "kg", "kilogram", "meter", "metre", "liter", "litre", "sqm", "square_meter"]),
  z.enum(["C62", "EA", "HUR", "DAY", "MON", "KGM", "MTR", "LTR", "MTK"])
]).transform((val): UnitCode => UNIT_CODES[val] as UnitCode);

/**************************************************************************
 * ENTITY SCHEMAS
 ***************************************************************************/

/**
 * Address schema - ISO 3166-1 alpha-2 country codes
 */
export const AddressSchema = z.object({
  line1: z.string().min(1, "Street address is required"),
  line2: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  city: z.string().min(1, "City is required"),
  countryCode: z.string().length(2, "Country code must be 2 characters (ISO 3166-1 alpha-2)")
});

/**
 * Legal registration identifier schemes (ISO 6523 ICA codes)
 * Complete list for all EU member states + common international schemes
 *
 * Reference: https://docs.peppol.eu/poacc/billing/3.0/codelist/ICD/
 */
export const LEGAL_ID_SCHEMES = {
  // 🇦🇹 Austria
  firmenbuch: "9915",           // Firmenbuchnummer
  uid_at: "9914",               // UID-Nummer

  // 🇧🇪 Belgium
  bce: "0208",                  // BCE/KBO number (Banque-Carrefour des Entreprises)
  kbo: "0208",                  // Same as BCE (Dutch name)

  // 🇧🇬 Bulgaria
  bulstat: "9926",              // BULSTAT register

  // 🇭🇷 Croatia
  oib: "9934",                  // OIB (Osobni identifikacijski broj)
  mbs: "9934",                  // MBS (Matični broj subjekta)

  // 🇨🇾 Cyprus
  cyprus_reg: "9928",           // Department of Registrar of Companies

  // 🇨🇿 Czech Republic
  ico: "9922",                  // IČO (Identifikační číslo osoby)

  // 🇩🇰 Denmark
  cvr: "0184",                  // CVR-nummer (Central Business Register)

  // 🇪🇪 Estonia
  ariregister: "9931",          // Äriregistri kood

  // 🇫🇮 Finland
  ytunnus: "0213",              // Y-tunnus (Business ID)
  ovt: "0037",                  // OVT-tunnus

  // 🇫🇷 France
  siret: "0002",                // SIRET (14 digits)
  siren: "0002",                // SIREN (9 digits)

  // 🇩🇪 Germany
  handelsregister: "0204",      // Handelsregisternummer
  ust_id_nr: "9930",            // Umsatzsteuer-ID

  // 🇬🇷 Greece
  gemi: "9933",                 // GEMI (General Electronic Commercial Registry)

  // 🇭🇺 Hungary
  cegjegyzek: "9910",           // Cégjegyzékszám (Company Registry Number)

  // 🇮🇪 Ireland
  cro: "9932",                  // Companies Registration Office

  // 🇮🇹 Italy
  rea: "0201",                  // REA (Repertorio Economico Amministrativo)
  codice_fiscale: "0211",       // Codice Fiscale

  // 🇱🇻 Latvia
  ur_lv: "9935",                // Uzņēmumu reģistra numurs

  // 🇱🇹 Lithuania
  rc_lt: "9936",                // Juridinio asmens kodas

  // 🇱🇺 Luxembourg
  rcs_lu: "9937",               // RCS (Registre de Commerce et des Sociétés)

  // 🇲🇹 Malta
  mfsa: "9938",                 // Malta Financial Services Authority

  // 🇳🇱 Netherlands
  kvk: "0106",                  // KVK-nummer (Kamer van Koophandel)

  // 🇵🇱 Poland
  krs: "9945",                  // KRS (Krajowy Rejestr Sądowy)
  regon: "9946",                // REGON
  nip: "9947",                  // NIP (tax number)

  // 🇵🇹 Portugal
  nipc: "9939",                 // NIPC (Número de Identificação de Pessoa Coletiva)

  // 🇷🇴 Romania
  cui: "9940",                  // CUI (Cod Unic de Înregistrare)

  // 🇸🇰 Slovakia
  ico_sk: "9941",               // IČO (Identifikačné číslo organizácie)

  // 🇸🇮 Slovenia
  maticna: "9942",              // Matična številka

  // 🇪🇸 Spain
  nif: "9920",                  // NIF (Número de Identificación Fiscal)

  // 🇸🇪 Sweden
  orgnr: "0007",                // Organisationsnummer

  // 🇬🇧 United Kingdom
  companies_house: "0195",      // Companies House

  // 🇨🇭 Switzerland
  uid_ch: "0183",               // UID (Unternehmens-Identifikationsnummer)

  // 🇳🇴 Norway
  orgnr_no: "0192",             // Organisasjonsnummer

  // 🌍 International
  eori: "9913",                 // EORI (Economic Operators Registration and Identification)
  gln: "0088",                  // GLN (Global Location Number)
  duns: "0060",                 // D-U-N-S (Dun & Bradstreet)
  lei: "0199",                  // LEI (Legal Entity Identifier)
  vat: "9906"                   // Generic EU VAT number
} as const;

export type LegalIdScheme = keyof typeof LEGAL_ID_SCHEMES;

// All legal ID scheme keys for the Zod enum
const LEGAL_ID_SCHEME_KEYS = Object.keys(LEGAL_ID_SCHEMES) as [LegalIdScheme, ...LegalIdScheme[]];

/**
 * Party schema (seller or buyer)
 */
export const PartySchema = z.object({
  name: z.string().min(1, "Party name is required"),
  address: AddressSchema,

  /** VAT identification number (e.g., "FR12345678901", "DE123456789") */
  vatId: z.string().optional(),

  /**
   * Legal registration identifier (company registration number)
   * Supports all EU member states + international schemes.
   * Examples: SIRET (FR), Handelsregister (DE), KVK (NL), CVR (DK), etc.
   */
  legalId: z.object({
    /** The identifier value */
    value: z.string().min(1),
    /** The scheme - use country-specific identifier */
    scheme: z.enum(LEGAL_ID_SCHEME_KEYS)
  }).optional(),

  email: z.string().email("Invalid email address")
    .optional(),
  phone: z.string().optional()
});

/**
 * Line item schema with EN16931 validation
 * Accepts user-friendly unit codes and VAT categories
 *
 * For refunds/credit notes, you have two options:
 * 1. Use typeCode: "credit_note" with POSITIVE amounts (recommended by EN16931)
 * 2. Use negative quantity or unitPrice (also supported)
 */
export const LineItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),

  /**
   * Quantity - can be negative for refunds/corrections
   * For credit notes, prefer positive values with typeCode: "credit_note"
   */
  quantity: z.number().refine(
    (val) => val !== 0,
    { message: "Quantity cannot be zero" }
  ),

  unitCode: UnitCodeSchema,

  /**
   * Unit price - can be negative for discounts/refunds
   * For credit notes, prefer positive values with typeCode: "credit_note"
   */
  unitPrice: z.number(),

  vatRate: z.number().min(0)
    .max(100, "VAT rate must be between 0 and 100"),
  vatCategoryCode: VATCategorySchema
});

/**
 * Payment information schema
 * Accepts user-friendly payment means
 */
export const PaymentSchema = z.object({
  meansCode: PaymentMeansSchema,
  iban: z.string().min(15)
    .max(34)
    .optional(),
  bic: z.string().min(8)
    .max(11)
    .optional(),
  paymentReference: z.string().optional()
});

/**
 * Invoice metadata schema
 * Accepts user-friendly invoice types
 */
export const InvoiceMetaSchema = z.object({
  number: z.string().min(1, "Invoice number is required"),
  issueDate: z.date({ message: "Issue date is required" }),
  dueDate: z.date().optional(),
  currencyCode: z.string().length(3, "Currency code must be 3 characters (ISO 4217)"),
  typeCode: InvoiceTypeSchema.default("380"),
  buyerReference: z.string().optional(),
  note: z.string().optional()
});

/**
 * Legal notice for the invoice
 */
export const LegalNoticeSchema = z.object({
  text: z.string(),
  weight: z.enum(["normal", "bold"]).optional()
});

/**
 * Complete invoice data schema - single source of truth
 */
export const InvoiceDataSchema = z.object({
  /** Invoice title for display */
  title: z.string().min(1, "Invoice title is required"),

  /** Invoice metadata */
  invoice: InvoiceMetaSchema,

  /** Seller (supplier) information */
  seller: PartySchema,

  /** Buyer (customer) information */
  buyer: PartySchema,

  /** Invoice line items - at least one required */
  lineItems: z.array(LineItemSchema).min(1, "At least one line item is required"),

  /** Payment information */
  payment: PaymentSchema.optional(),

  /** Legal notices to display at the bottom */
  legal: z.array(LegalNoticeSchema).optional(),

  /** Enable Factur-X XML embedding (PDF/A-3) */
  facturx: z.boolean().default(false)
});

/**************************************************************************
 * INPUT TYPES (what users provide - with friendly names)
 ***************************************************************************/

export type VATCategoryInput = keyof typeof VAT_CATEGORIES;
export type InvoiceTypeInput = keyof typeof INVOICE_TYPES;
export type PaymentMeansInput = keyof typeof PAYMENT_MEANS;
export type UnitCodeInput = keyof typeof UNIT_CODES;

/**
 * Line item input (before transformation)
 */
export interface LineItemInput {
  description: string;
  quantity: number;
  unitCode: UnitCodeInput;
  unitPrice: number;
  vatRate: number;
  vatCategoryCode: VATCategoryInput;
}

/**
 * Invoice data input (before transformation)
 */
export interface InvoiceDataInput {
  title: string;
  invoice: {
    number: string;
    issueDate: Date;
    dueDate?: Date;
    currencyCode: string;
    typeCode?: InvoiceTypeInput;
    buyerReference?: string;
    note?: string;
  };
  seller: z.input<typeof PartySchema>;
  buyer: z.input<typeof PartySchema>;
  lineItems: LineItemInput[];
  payment?: {
    meansCode: PaymentMeansInput;
    iban?: string;
    bic?: string;
    paymentReference?: string;
  };
  legal?: Array<{ text: string; weight?: "normal" | "bold" }>;
  facturx?: boolean;
}

/**************************************************************************
 * OUTPUT TYPES (after Zod transformation - with official codes)
 ***************************************************************************/

export type Address = z.infer<typeof AddressSchema>;
export type Party = z.infer<typeof PartySchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type InvoiceMeta = z.infer<typeof InvoiceMetaSchema>;
export type LegalNotice = z.infer<typeof LegalNoticeSchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

/**************************************************************************
 * HELPERS
 ***************************************************************************/

/**
 * Validate invoice data and return parsed result with converted codes
 * @throws ZodError if validation fails
 */
export function validateInvoice(data: InvoiceDataInput): InvoiceData {
  return InvoiceDataSchema.parse(data);
}

/**
 * Safely validate invoice data without throwing
 */
export function safeValidateInvoice(data: InvoiceDataInput): {
  success: boolean;
  data?: InvoiceData;
  error?: z.ZodError;
} {
  const result = InvoiceDataSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Computed totals for the invoice
 */
export interface InvoiceTotals {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatBreakdown: Array<{
    rate: number;
    categoryCode: VATCategoryCode;
    baseAmount: number;
    vatAmount: number;
  }>;
}

/**
 * Calculate invoice totals from line items
 */
export function calculateTotals(lineItems: LineItem[]): InvoiceTotals {
  const vatMap = new Map<string, {
    rate: number;
    categoryCode: VATCategoryCode;
    baseAmount: number;
    vatAmount: number;
  }>();

  let netAmount = 0;
  let vatAmount = 0;

  for (const item of lineItems) {
    const lineNet = item.quantity * item.unitPrice;
    const lineVat = lineNet * (item.vatRate / 100);

    netAmount += lineNet;
    vatAmount += lineVat;

    const key = `${item.vatRate}-${item.vatCategoryCode}`;
    const existing = vatMap.get(key);

    if (existing) {
      existing.baseAmount += lineNet;
      existing.vatAmount += lineVat;
    } else {
      vatMap.set(key, {
        rate: item.vatRate,
        categoryCode: item.vatCategoryCode,
        baseAmount: lineNet,
        vatAmount: lineVat
      });
    }
  }

  return {
    netAmount,
    vatAmount,
    grossAmount: netAmount + vatAmount,
    vatBreakdown: Array.from(vatMap.values())
  };
}

/**
 * Format a party address as an array of strings for display
 */
export function formatPartyAddress(party: Party): string[] {
  const lines = [party.name];

  if (party.email) {
    lines.push(party.email);
  }

  lines.push(party.address.line1);

  if (party.address.line2) {
    lines.push(party.address.line2);
  }

  lines.push(`${party.address.postalCode} ${party.address.city}`);
  lines.push(party.address.countryCode);

  return lines;
}

/**************************************************************************
 * LEGACY EXPORTS (backward compatibility)
 ***************************************************************************/

// Keep old constant names as aliases
export const VAT_CATEGORY_CODES = VAT_CATEGORY_LABELS;
export const INVOICE_TYPE_CODES = INVOICE_TYPE_LABELS;
export const PAYMENT_MEANS_CODES = PAYMENT_MEANS_LABELS;
