/*
 * microinvoice - Factur-X Types
 *
 * Copyright 2025, Baptiste Jamin
 * Author: Baptiste Jamin <baptiste@crisp.chat>
 */

/**
 * VAT category codes according to UNCL5305
 * S = Standard rate
 * Z = Zero rated goods
 * E = Exempt from tax
 * AE = Reverse charge (VAT due by buyer)
 * K = Intra-community supply
 * G = Export outside the EU
 * O = Not subject to VAT
 * L = Canary Islands general indirect tax
 * M = Tax for production, services and importation in Ceuta and Melilla
 */
export type VATCategoryCode = "S" | "Z" | "E" | "AE" | "K" | "G" | "O" | "L" | "M";

/**
 * Invoice type codes according to UNTDID 1001
 * 380 = Commercial Invoice
 * 381 = Credit Note
 * 384 = Corrected Invoice
 * 389 = Self-billed Invoice
 */
export type InvoiceTypeCode = "380" | "381" | "384" | "389";

/**
 * Payment means codes according to UNTDID 4461
 * 30 = Credit transfer
 * 31 = Debit transfer
 * 42 = Payment to bank account
 * 48 = Bank card
 * 49 = Direct debit
 * 57 = Standing agreement
 * 58 = SEPA credit transfer
 */
export type PaymentMeansCode = "30" | "31" | "42" | "48" | "49" | "57" | "58";

/**
 * Party address for seller or buyer
 */
export interface FacturXAddress {
  /** Street address line 1 */
  line1: string;
  /** Street address line 2 (optional) */
  line2?: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** City name */
  city: string;
  /** Country code - ISO 3166-1 alpha-2 (e.g., FR, DE, BE) */
  countryCode: string;
}

/**
 * Party information (seller or buyer)
 */
export interface FacturXParty {
  /** Legal name of the party */
  name: string;
  /** Postal address */
  address: FacturXAddress;
  /** VAT identification number (e.g., "FR12345678901") */
  vatId?: string;
  /** French SIRET number (14 digits) */
  siret?: string;
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
}

/**
 * Line item in the invoice
 */
export interface FacturXLineItem {
  /** Product or service description */
  description: string;
  /** Quantity of items */
  quantity: number;
  /**
   * Unit code according to UN/ECE Recommendation 20
   * Common codes:
   * - C62 = One (unit)
   * - HUR = Hour
   * - DAY = Day
   * - MON = Month
   * - KGM = Kilogram
   * - MTR = Metre
   * - LTR = Litre
   */
  unitCode: string;
  /** Unit price (excluding VAT) */
  unitPrice: number;
  /** VAT rate as percentage (e.g., 20 for 20%) */
  vatRate: number;
  /** VAT category code */
  vatCategoryCode: VATCategoryCode;
}

/**
 * Payment information
 */
export interface FacturXPayment {
  /** Payment means code */
  meansCode: PaymentMeansCode;
  /** IBAN for bank transfers */
  iban?: string;
  /** BIC/SWIFT code */
  bic?: string;
  /** Payment reference (e.g., structured communication) */
  paymentReference?: string;
}

/**
 * Invoice metadata
 */
export interface FacturXInvoice {
  /** Unique invoice number */
  number: string;
  /** Invoice issue date */
  issueDate: Date;
  /** Payment due date */
  dueDate?: Date;
  /** Currency code - ISO 4217 (e.g., EUR, USD) */
  currencyCode: string;
  /** Invoice type code (default: 380 = Commercial Invoice) */
  typeCode?: InvoiceTypeCode;
  /** Buyer reference / Purchase order number */
  buyerReference?: string;
  /** Free text note on the invoice */
  note?: string;
}

/**
 * Factur-X configuration options for EN16931 profile
 */
export interface FacturXOptions {
  /** Enable Factur-X generation */
  enabled: boolean;

  /** Seller (supplier) information - mandatory */
  seller: FacturXParty;

  /** Buyer (customer) information - mandatory */
  buyer: FacturXParty;

  /** Invoice metadata - mandatory */
  invoice: FacturXInvoice;

  /** Invoice line items - at least one required for EN16931 */
  lineItems: FacturXLineItem[];

  /** Payment information - optional but recommended */
  payment?: FacturXPayment;
}

/**
 * Computed totals for the invoice
 */
export interface FacturXTotals {
  /** Sum of all line net amounts */
  netAmount: number;
  /** Total VAT amount */
  vatAmount: number;
  /** Total amount including VAT */
  grossAmount: number;
  /** VAT breakdown by rate */
  vatBreakdown: Array<{
    rate: number;
    categoryCode: VATCategoryCode;
    baseAmount: number;
    vatAmount: number;
  }>;
}
