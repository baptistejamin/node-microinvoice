/*
 * microinvoice - Factur-X XML Generator
 *
 * Copyright 2025, Baptiste Jamin
 * Author: Baptiste Jamin <baptiste@crisp.chat>
 *
 * Generates CII (Cross-Industry Invoice) XML following UN/CEFACT D16B schema
 * for Factur-X EN16931 profile compliance.
 */

// NPM
import { create } from "xmlbuilder2";

// PROJECT: FACTURX
import type { InvoiceData, Party, InvoiceTotals } from "./schema.js";
import { calculateTotals, LEGAL_ID_SCHEMES } from "./schema.js";

// XML Namespaces for CII
const NAMESPACES = {
  rsm: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
  ram: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
  udt: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
  qdt: "urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
};

// EN16931 profile guideline ID
const GUIDELINE_ID = "urn:factur-x.eu:1p0:en16931";

/**
 * Format a date as YYYYMMDD (format 102)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Format a number with 2 decimal places
 */
function formatAmount(value: number): string {
  return value.toFixed(2);
}

/**
 * Add party trade information (seller or buyer)
 */
function addTradeParty(
  parent: ReturnType<typeof create>,
  party: Party,
  elementName: string
): void {
  const partyElement = parent.ele(`ram:${elementName}`);

  // Party name
  partyElement.ele("ram:Name").txt(party.name);

  // Legal registration (company ID: SIRET, KVK, Handelsregister, etc.)
  if (party.legalId) {
    const schemeId = LEGAL_ID_SCHEMES[party.legalId.scheme];

    partyElement
      .ele("ram:SpecifiedLegalOrganization")
      .ele("ram:ID", { schemeID: schemeId })
      .txt(party.legalId.value);
  }

  // Postal address
  const address = partyElement.ele("ram:PostalTradeAddress");

  address.ele("ram:PostcodeCode").txt(party.address.postalCode);
  address.ele("ram:LineOne").txt(party.address.line1);

  if (party.address.line2) {
    address.ele("ram:LineTwo").txt(party.address.line2);
  }

  address.ele("ram:CityName").txt(party.address.city);
  address.ele("ram:CountryID").txt(party.address.countryCode);

  // Email
  if (party.email) {
    partyElement
      .ele("ram:URIUniversalCommunication")
      .ele("ram:URIID", { schemeID: "EM" })
      .txt(party.email);
  }

  // VAT ID
  if (party.vatId) {
    partyElement
      .ele("ram:SpecifiedTaxRegistration")
      .ele("ram:ID", { schemeID: "VA" })
      .txt(party.vatId);
  }
}

/**
 * Generate Factur-X XML from unified invoice data
 */
export function generateFacturXML(data: InvoiceData): string {
  const totals = calculateTotals(data.lineItems);
  const typeCode = data.invoice.typeCode || "380";

  // Create root document with namespaces
  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("rsm:CrossIndustryInvoice", {
      "xmlns:rsm": NAMESPACES.rsm,
      "xmlns:ram": NAMESPACES.ram,
      "xmlns:udt": NAMESPACES.udt,
      "xmlns:qdt": NAMESPACES.qdt
    });

  // === ExchangedDocumentContext ===
  doc
    .ele("rsm:ExchangedDocumentContext")
    .ele("ram:GuidelineSpecifiedDocumentContextParameter")
    .ele("ram:ID")
    .txt(GUIDELINE_ID);

  // === ExchangedDocument ===
  const exchangedDoc = doc.ele("rsm:ExchangedDocument");

  exchangedDoc.ele("ram:ID").txt(data.invoice.number);
  exchangedDoc.ele("ram:TypeCode").txt(typeCode);

  exchangedDoc
    .ele("ram:IssueDateTime")
    .ele("udt:DateTimeString", { format: "102" })
    .txt(formatDate(data.invoice.issueDate));

  if (data.invoice.note) {
    exchangedDoc
      .ele("ram:IncludedNote")
      .ele("ram:Content")
      .txt(data.invoice.note);
  }

  // === SupplyChainTradeTransaction ===
  const transaction = doc.ele("rsm:SupplyChainTradeTransaction");

  // --- Line Items ---
  data.lineItems.forEach((item, index) => {
    const lineNet = item.quantity * item.unitPrice;
    const lineItem = transaction.ele("ram:IncludedSupplyChainTradeLineItem");

    // Line ID
    lineItem
      .ele("ram:AssociatedDocumentLineDocument")
      .ele("ram:LineID")
      .txt(String(index + 1));

    // Product
    lineItem
      .ele("ram:SpecifiedTradeProduct")
      .ele("ram:Name")
      .txt(item.description);

    // Line agreement (unit price)
    const lineAgreement = lineItem.ele("ram:SpecifiedLineTradeAgreement");

    lineAgreement
      .ele("ram:NetPriceProductTradePrice")
      .ele("ram:ChargeAmount")
      .txt(formatAmount(item.unitPrice));

    // Line delivery (quantity)
    lineItem
      .ele("ram:SpecifiedLineTradeDelivery")
      .ele("ram:BilledQuantity", { unitCode: item.unitCode })
      .txt(formatAmount(item.quantity));

    // Line settlement (VAT and totals)
    const lineSettlement = lineItem.ele("ram:SpecifiedLineTradeSettlement");

    const lineTax = lineSettlement.ele("ram:ApplicableTradeTax");

    lineTax.ele("ram:TypeCode").txt("VAT");
    lineTax.ele("ram:CategoryCode").txt(item.vatCategoryCode);
    lineTax.ele("ram:RateApplicablePercent").txt(formatAmount(item.vatRate));

    lineSettlement
      .ele("ram:SpecifiedTradeSettlementLineMonetarySummation")
      .ele("ram:LineTotalAmount")
      .txt(formatAmount(lineNet));
  });

  // --- Header Trade Agreement ---
  const headerAgreement = transaction.ele("ram:ApplicableHeaderTradeAgreement");

  // Buyer reference
  if (data.invoice.buyerReference) {
    headerAgreement.ele("ram:BuyerReference").txt(data.invoice.buyerReference);
  }

  // Seller
  addTradeParty(headerAgreement, data.seller, "SellerTradeParty");

  // Buyer
  addTradeParty(headerAgreement, data.buyer, "BuyerTradeParty");

  // --- Header Trade Delivery ---
  transaction.ele("ram:ApplicableHeaderTradeDelivery");

  // --- Header Trade Settlement ---
  const headerSettlement = transaction.ele("ram:ApplicableHeaderTradeSettlement");

  // Payment reference
  if (data.payment?.paymentReference) {
    headerSettlement.ele("ram:PaymentReference").txt(data.payment.paymentReference);
  }

  // Currency
  headerSettlement.ele("ram:InvoiceCurrencyCode").txt(data.invoice.currencyCode);

  // Payment means
  if (data.payment) {
    const paymentMeans = headerSettlement.ele("ram:SpecifiedTradeSettlementPaymentMeans");

    paymentMeans.ele("ram:TypeCode").txt(data.payment.meansCode);

    if (data.payment.iban) {
      const payeeAccount = paymentMeans.ele("ram:PayeePartyCreditorFinancialAccount");

      payeeAccount.ele("ram:IBANID").txt(data.payment.iban);

      if (data.payment.bic) {
        paymentMeans
          .ele("ram:PayeeSpecifiedCreditorFinancialInstitution")
          .ele("ram:BICID")
          .txt(data.payment.bic);
      }
    }
  }

  // VAT breakdown
  for (const vat of totals.vatBreakdown) {
    const tax = headerSettlement.ele("ram:ApplicableTradeTax");

    tax.ele("ram:CalculatedAmount").txt(formatAmount(vat.vatAmount));
    tax.ele("ram:TypeCode").txt("VAT");
    tax.ele("ram:BasisAmount").txt(formatAmount(vat.baseAmount));
    tax.ele("ram:CategoryCode").txt(vat.categoryCode);
    tax.ele("ram:RateApplicablePercent").txt(formatAmount(vat.rate));
  }

  // Payment terms (due date)
  if (data.invoice.dueDate) {
    headerSettlement
      .ele("ram:SpecifiedTradePaymentTerms")
      .ele("ram:DueDateDateTime")
      .ele("udt:DateTimeString", { format: "102" })
      .txt(formatDate(data.invoice.dueDate));
  }

  // Monetary summation
  const monetarySummation = headerSettlement.ele(
    "ram:SpecifiedTradeSettlementHeaderMonetarySummation"
  );

  monetarySummation.ele("ram:LineTotalAmount").txt(formatAmount(totals.netAmount));
  monetarySummation.ele("ram:TaxBasisTotalAmount").txt(formatAmount(totals.netAmount));

  monetarySummation
    .ele("ram:TaxTotalAmount", { currencyID: data.invoice.currencyCode })
    .txt(formatAmount(totals.vatAmount));

  monetarySummation.ele("ram:GrandTotalAmount").txt(formatAmount(totals.grossAmount));
  monetarySummation.ele("ram:DuePayableAmount").txt(formatAmount(totals.grossAmount));

  return doc.end({ prettyPrint: true });
}

// Re-export for convenience
export { calculateTotals };
export type { InvoiceTotals };
