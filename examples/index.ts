import Microinvoice from "../lib/index.js";
import type { InvoiceDataInput } from "../lib/index.js";

// Unified invoice data with user-friendly codes
// No more cryptic "380", "58", "S" - just readable names!
const invoiceData: InvoiceDataInput = {
  title: "Invoice for Crisp",

  invoice: {
    number: "INV-2025-0221",
    issueDate: new Date("2025-11-03"),
    dueDate: new Date("2025-12-03"),
    currencyCode: "EUR",
    typeCode: "invoice",  // ← Friendly! (converts to "380")
    buyerReference: "PO-2025-001"
  },

  seller: {
    name: "Crisp IM SAS",
    address: {
      line1: "2 Boulevard de Launay",
      postalCode: "44100",
      city: "Nantes",
      countryCode: "FR"
    },
    vatId: "FR50833085806",
    legalId: {
      value: "83308580600015",
      scheme: "siret"  // ← Works for any EU country: "kvk", "handelsregister", etc.
    },
    email: "support@crisp.chat"
  },

  buyer: {
    name: "Valerian Saliou",
    address: {
      line1: "2 Boulevard de Launay",
      postalCode: "44100",
      city: "Nantes",
      countryCode: "FR"
    },
    vatId: "FR50833085806",
    email: "valerian@valeriansaliou.name"
  },

  // Line items with friendly codes
  lineItems: [
    {
      description: "Plugin: Messenger (Crisp#)",
      quantity: 1,
      unitCode: "unit",        // ← Friendly! (converts to "C62")
      unitPrice: 20.00,
      vatRate: 20,
      vatCategoryCode: "standard"  // ← Friendly! (converts to "S")
    },
    {
      description: "Limit: Translate Requests x1 (Crisp#)",
      quantity: 1,
      unitCode: "unit",
      unitPrice: 50.00,
      vatRate: 20,
      vatCategoryCode: "standard"
    },
    {
      description: "Limit: Bucket Url x1 (Crisp#)",
      quantity: 1,
      unitCode: "unit",
      unitPrice: 50.00,
      vatRate: 20,
      vatCategoryCode: "standard"
    },
    {
      description: "Consulting Hours",
      quantity: 5,
      unitCode: "hour",         // ← Friendly! (converts to "HUR")
      unitPrice: 150.00,
      vatRate: 20,
      vatCategoryCode: "standard"
    }
  ],

  // Payment with friendly code
  payment: {
    meansCode: "sepa",  // ← Friendly! (converts to "58")
    iban: "FR7630001007941234567890185",
    bic: "BNPAFRPP"
  },

  legal: [
    {
      text: "Your payment ensures uninterrupted service by Crisp.",
      weight: "normal"
    }
  ],

  facturx: true
};

// Create the invoice
const myInvoice = new Microinvoice({
  style: {
    header: {
      backgroundColor: "#1972f5",
      regularColor: "#FFFFFF",
      secondaryColor: "#A3C6FB"
    }
  },
  invoiceData
});

// Generate!
myInvoice.generate("example-facturx.pdf").then(() => {
  console.log("Factur-X invoice saved to example-facturx.pdf");
  console.log("");
  console.log("Friendly codes used:");
  console.log("  typeCode: 'invoice' → '380'");
  console.log("  unitCode: 'unit' → 'C62', 'hour' → 'HUR'");
  console.log("  vatCategoryCode: 'standard' → 'S'");
  console.log("  meansCode: 'sepa' → '58'");
}).catch((error) => {
  console.error("Error generating invoice:", error);
});
