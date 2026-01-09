import Microinvoice from "../lib/index.js";
import type { FacturXOptions } from "../lib/index.js";

// Factur-X EN16931 compliant invoice data
const facturxOptions: FacturXOptions = {
  enabled: true,

  seller: {
    name: "Crisp IM SAS",
    address: {
      line1: "2 Boulevard de Launay",
      postalCode: "44100",
      city: "Nantes",
      countryCode: "FR"
    },
    vatId: "FR50833085806",
    siret: "83308580600015",
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

  invoice: {
    number: "INV-2025-0221",
    issueDate: new Date("2025-11-03"),
    dueDate: new Date("2025-12-03"),
    currencyCode: "EUR",
    typeCode: "380",
    buyerReference: "PO-2025-001"
  },

  lineItems: [
    {
      description: "Plugin: Messenger (Crisp#)",
      quantity: 1,
      unitCode: "C62",
      unitPrice: 20.00,
      vatRate: 20,
      vatCategoryCode: "S"
    },
    {
      description: "Limit: Translate Requests x1 (Crisp#)",
      quantity: 1,
      unitCode: "C62",
      unitPrice: 50.00,
      vatRate: 20,
      vatCategoryCode: "S"
    },
    {
      description: "Limit: Bucket Url x1 (Crisp#)",
      quantity: 1,
      unitCode: "C62",
      unitPrice: 50.00,
      vatRate: 20,
      vatCategoryCode: "S"
    },
    {
      description: "Limit: Operator Invites x6 (Crisp#)",
      quantity: 1,
      unitCode: "C62",
      unitPrice: 6.00,
      vatRate: 20,
      vatCategoryCode: "S"
    },
    {
      description: "Limit: Translate Characters x1 (Crisp#)",
      quantity: 1,
      unitCode: "C62",
      unitPrice: 20.00,
      vatRate: 20,
      vatCategoryCode: "S"
    }
  ],

  payment: {
    meansCode: "58",
    iban: "FR7630001007941234567890185",
    bic: "BNPAFRPP"
  }
};

// Create the new invoice with Factur-X support
const myInvoice = new Microinvoice({
  style: {
    header: {
      backgroundColor: "#1972f5",
      regularColor: "#FFFFFF",
      secondaryColor: "#A3C6FB"
    }
  },

  data: {
    invoice: {
      name: "Invoice for Crisp",
      header: [
        {
          label: "Invoice Number",
          value: "INV-2025-0221"
        },
        {
          label: "Date",
          value: "Mon Nov 03 2025"
        },
        {
          label: "Invoice Status",
          value: "Paid"
        }
      ],
      customer: [
        {
          label: "Bill To",
          value: [
            "Valerian Saliou",
            "valerian@valeriansaliou.name",
            "2 Boulevard de Launay",
            "44100 Nantes",
            "France"
          ]
        },
        {
          label: "Tax Identifier",
          value: "FR50833085806"
        }
      ],
      seller: [
        {
          label: "Bill From",
          value: [
            "Crisp IM SAS",
            "support@crisp.chat",
            "2 Boulevard de Launay",
            "44100 Nantes",
            "France"
          ]
        },
        {
          label: "Tax Identifier",
          value: "FR50833085806"
        },
        {
          label: "Company ID (SIRET)",
          value: "83308580600015"
        }
      ],
      details: {
        header: [
          { value: "Description" },
          { value: "Quantity" },
          { value: "Subtotal" }
        ],
        parts: [
          [
            { value: "Plugin: Messenger (Crisp#)" },
            { value: 1 },
            { value: 20, price: true }
          ],
          [
            { value: "Limit: Translate Requests x1 (Crisp#)" },
            { value: 1 },
            { value: 50, price: true }
          ],
          [
            { value: "Limit: Bucket Url x1 (Crisp#)" },
            { value: 1 },
            { value: 50, price: true }
          ],
          [
            { value: "Limit: Operator Invites x6 (Crisp#)" },
            { value: 1 },
            { value: 6, price: true }
          ],
          [
            { value: "Limit: Translate Characters x1 (Crisp#)" },
            { value: 1 },
            { value: 20, price: true }
          ]
        ],
        total: [
          { label: "Total without VAT", value: 146, price: true },
          { label: "VAT Rate", value: "20.00%" },
          { label: "VAT Paid", value: 29.2, price: true },
          { label: "Total with VAT", value: 175.2, price: true }
        ]
      },
      currency: "EUR",
      legal: [
        {
          value: "Your payment ensures uninterrupted service by Crisp.",
          color: "secondary"
        }
      ]
    }
  },

  // Enable Factur-X EN16931 compliance
  facturx: facturxOptions
});

// Render Factur-X compliant PDF invoice
myInvoice.generate("example-facturx.pdf").then(() => {
  console.log("Factur-X invoice saved to example-facturx.pdf");
}).catch((error) => {
  console.error("Error generating invoice:", error);
});
