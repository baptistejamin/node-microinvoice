/*
 * microinvoice - Factur-X Module
 *
 * Copyright 2025, Baptiste Jamin
 * Author: Baptiste Jamin <baptiste@crisp.chat>
 */

// Schema and validation (Zod-based)
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
  type VATCategoryCode,
  type InvoiceTypeCode,
  type PaymentMeansCode,
  type UnitCode,
  type InvoiceTotals,

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
  calculateTotals,
  formatPartyAddress,

  // Constants with friendly names
  VAT_CATEGORIES,
  INVOICE_TYPES,
  PAYMENT_MEANS,
  UNIT_CODES,
  LEGAL_ID_SCHEMES,
  type LegalIdScheme,

  // Labels
  VAT_CATEGORY_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_MEANS_LABELS,
  UNIT_CODE_LABELS,

  // Legacy constant names (backward compatibility)
  VAT_CATEGORY_CODES,
  INVOICE_TYPE_CODES,
  PAYMENT_MEANS_CODES
} from "./schema.js";

// XML generation
export { generateFacturXML } from "./xml-generator.js";

// PDF/A-3 embedding
export { embedFacturX } from "./pdf-a3.js";

// Legacy types (for backward compatibility)
export * from "./types.js";
