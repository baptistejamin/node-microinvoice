"use strict";

const MicroInvoice = require("../lib");

// Create the new invoice
let myInvoice = new MicroInvoice({
  style : {
    header : {
      image : {
        path : "./examples/logo.png",
        width : 50,
        height : 19
      }
    }
  },
  data : {
    invoice : {
      name : "Invoice",

      header : [{
        label : "Invoice Number",
        value : 1
      }, {
        label : "Status",
        value : "Paid afsdf  asfdasd  asf asdf as asdfasdf asd asd fasf"
      }, {
        label : "Date",
        value : "22/10/21"
      }],

      currency : "EUR",

      customer : [{
        label : "Bill To",
        value : [
          "John Doe",
          "Acme Corp",
          "john.doe@gmail.com",
          "+145453242342342",
          "522 Main Street, New York",
          "USA"
        ]
      }, {
          label : "Tax Identifier",
          value : "352352342333"
        }, {
          label : "Information",
          value : "Deliver to the door"
        }
      ],

      seller : [{
        label : "Bill From",
        value : [
          "Big Corp",
          "2 Flowers Streets, London",
          "UK",
          "+44245345435345",
          "biling@bigcorp.com"
        ]
      }, {
        label : "Tax Identifier",
        value : "5345345345435345345"
      }],

      legal : [{
        value  : "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        weight : "bold",
        color  : "primary"
      }, {
        value  : "sed do eiusmod tempor incididunt ut labore et dolore magna.",
        weight : "bold",
        color  : "secondary"
      }],

      details : {
        header : [{
          value : "Description"
        }, {
          value : "Quantity"
        }],

        parts : [
          [{
            value : "Nike Air Max Lorem ipsum dolor sit amet, consectetur adipiscing elit Lorem ipsum dolor sit amet, consectetur adipiscing elit Lorem ipsum dolor sit amet, consectetur adipiscing elit"
          }, {
            value : 1
          }, {
            value : "53",
            price : true
          }],

          [{
            value : "Discount"
          }, {
            value : 1
          }, {
            value : "-10",
            price : true
          }]
        ],

        total : []
      }
    }
  }
});

// Render invoice as PDF
myInvoice.generate("examples/example.pdf").then(() => {
  console.log("Invoice saved");
}).catch((error) => {
  console.error(error);
});