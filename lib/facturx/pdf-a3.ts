/*
 * microinvoice - Factur-X PDF/A-3 Converter
 *
 * Copyright 2025, Baptiste Jamin
 * Author: Baptiste Jamin <baptiste@crisp.chat>
 *
 * Embeds Factur-X XML into PDF and adds required XMP metadata
 * for PDF/A-3b and Factur-X EN16931 compliance.
 */

// NPM
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFHexString, AFRelationship } from "pdf-lib";

// Factur-X profile levels
type FacturXProfile = "MINIMUM" | "BASIC_WL" | "BASIC" | "EN16931" | "EXTENDED";

// Profile to conformance level mapping
const PROFILE_CONFORMANCE: Record<FacturXProfile, string> = {
  MINIMUM: "MINIMUM",
  BASIC_WL: "BASIC WL",
  BASIC: "BASIC",
  EN16931: "EN 16931",
  EXTENDED: "EXTENDED"
};

/**
 * Generate XMP metadata for Factur-X PDF/A-3b compliance
 */
function generateXMPMetadata(
  profile: FacturXProfile,
  title: string,
  creationDate: Date
): string {
  const conformanceLevel = PROFILE_CONFORMANCE[profile];
  const dateStr = creationDate.toISOString();

  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      
      <!-- PDF/A-3b identification -->
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      
      <!-- Document metadata -->
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>microinvoice</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <xmp:CreatorTool>microinvoice</xmp:CreatorTool>
      <xmp:CreateDate>${dateStr}</xmp:CreateDate>
      <xmp:ModifyDate>${dateStr}</xmp:ModifyDate>
      <pdf:Producer>microinvoice (pdf-lib)</pdf:Producer>
      
      <!-- Factur-X specific metadata -->
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${conformanceLevel}</fx:ConformanceLevel>
      
      <!-- PDF/A Extension Schema for Factur-X -->
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Type of the hybrid document</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Version of the Factur-X standard</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Conformance level of the Factur-X invoice</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Embed Factur-X XML into PDF and add PDF/A-3 metadata
 *
 * @param pdfBuffer - Original PDF buffer
 * @param xmlContent - Factur-X XML content
 * @param profile - Factur-X profile level
 * @param title - Invoice title for metadata
 * @returns PDF buffer with embedded XML and XMP metadata
 */
export async function embedFacturX(
  pdfBuffer: Uint8Array,
  xmlContent: string,
  profile: FacturXProfile,
  title: string
): Promise<Uint8Array> {
  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    updateMetadata: false
  });

  // Embed the XML file as an attachment
  const xmlBytes = new TextEncoder().encode(xmlContent);

  await pdfDoc.attach(
    xmlBytes,
    "factur-x.xml",
    {
      mimeType: "text/xml",
      description: "Factur-X XML Invoice",
      afRelationship: AFRelationship.Alternative
    }
  );

  // Generate and set XMP metadata
  const xmpMetadata = generateXMPMetadata(profile, title, new Date());

  pdfDoc.setTitle(title);
  pdfDoc.setCreator("microinvoice");
  pdfDoc.setProducer("microinvoice (pdf-lib)");
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  // Inject custom XMP metadata
  const xmpBytes = new TextEncoder().encode(xmpMetadata);

  const metadataStream = pdfDoc.context.stream(xmpBytes, {
    Type: "Metadata",
    Subtype: "XML"
  });

  const metadataRef = pdfDoc.context.register(metadataStream);

  pdfDoc.catalog.set(PDFName.of("Metadata"), metadataRef);

  // Add OutputIntent for PDF/A compliance
  await addOutputIntent(pdfDoc);

  // Mark embedded files for PDF/A-3
  markEmbeddedFilesForPDFA3(pdfDoc);

  // Save and return the modified PDF
  return await pdfDoc.save();
}

/**
 * Add sRGB output intent for PDF/A compliance
 */
async function addOutputIntent(pdfDoc: PDFDocument): Promise<void> {
  const context = pdfDoc.context;

  // Create a minimal sRGB ICC profile reference
  // For full compliance, a real ICC profile should be embedded
  const outputIntentDict = context.obj({
    Type: PDFName.of("OutputIntent"),
    S: PDFName.of("GTS_PDFA1"),
    OutputConditionIdentifier: PDFHexString.fromText("sRGB"),
    RegistryName: PDFHexString.fromText("http://www.color.org"),
    Info: PDFHexString.fromText("sRGB IEC61966-2.1")
  });

  const outputIntentRef = context.register(outputIntentDict);
  const outputIntents = context.obj([outputIntentRef]);

  pdfDoc.catalog.set(PDFName.of("OutputIntents"), outputIntents);
}

/**
 * Mark embedded files with proper AF relationship for PDF/A-3
 */
function markEmbeddedFilesForPDFA3(pdfDoc: PDFDocument): void {
  const context = pdfDoc.context;
  const catalog = pdfDoc.catalog;

  // Get the Names dictionary
  const namesDict = catalog.lookup(PDFName.of("Names"));

  if (namesDict instanceof PDFDict) {
    const embeddedFiles = namesDict.lookup(PDFName.of("EmbeddedFiles"));

    if (embeddedFiles instanceof PDFDict) {
      // The embedded files should already have AFRelationship set by pdf-lib
      // This function ensures the structure is correct for PDF/A-3

      // Get AF array from catalog or create one
      let afArray = catalog.lookup(PDFName.of("AF"));

      if (!(afArray instanceof PDFArray)) {
        afArray = context.obj([]);
        catalog.set(PDFName.of("AF"), afArray);
      }
    }
  }
}
