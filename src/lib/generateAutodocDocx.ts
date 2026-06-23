import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

type AutodocSection = {
  id?: string;
  title: string;
  content: string;
  images?: string[];
  promptMode?: boolean;
  isGenerating?: boolean;
  error?: string | null;
};

type AutodocMetadata = {
  userEmail?: string;
  orgName?: string;
  clientName?: string;
  clientEmail?: string;
  [key: string]: string | undefined;
};

type GenerateAutodocDocxInput = {
  documentTitle: string;
  sections: AutodocSection[];
  metadata: AutodocMetadata;
};

type ImageInfo = {
  dataUrl: string;
  extension: 'png' | 'jpg' | 'jpeg' | 'gif';
  contentType: string;
  base64: string;
  widthPx: number;
  heightPx: number;
};

type ImageBuildContext = {
  zip: PizZip;
  relationships: string[];
  imageCounter: number;
};

const EMUS_PER_INCH = 914400;
const PX_PER_INCH = 96;

function escapeXml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '_')
    .trim();

  return cleaned || 'AUTODOC';
}

function softenLongWords(value: string, every = 18): string {
  return value.replace(new RegExp(`([^\\s]{${every}})`, 'g'), '$1\u200B');
}

function replaceAllPlaceholders(
  xml: string,
  replacements: Record<string, string>
): string {
  let output = xml;

  Object.entries(replacements).forEach(([key, value]) => {
    output = output.split(`[[${key}]]`).join(escapeXml(value));
  });

  return output;
}

function runXml(
  text: string,
  options?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    fontSizeHalfPoints?: number;
  }
): string {
  if (!text) return '';

  const hasFormatting =
    options?.bold ||
    options?.italic ||
    options?.underline ||
    options?.color ||
    options?.fontSizeHalfPoints;

  const rPr = hasFormatting
    ? `<w:rPr>
        ${options?.bold ? '<w:b/>' : ''}
        ${options?.italic ? '<w:i/>' : ''}
        ${options?.underline ? '<w:u w:val="single"/>' : ''}
        ${options?.color ? `<w:color w:val="${options.color}"/>` : ''}
        ${
          options?.fontSizeHalfPoints
            ? `<w:sz w:val="${options.fontSizeHalfPoints}"/>`
            : ''
        }
      </w:rPr>`
    : '';

  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function breakXml(): string {
  return '<w:r><w:br/></w:r>';
}

function paragraphXml(
  content: string,
  options?: {
    style?: string;
    spacingAfter?: number;
    indentLeft?: number;
    hanging?: number;
  }
): string {
  const pPrParts: string[] = [];

  if (options?.style) {
    pPrParts.push(`<w:pStyle w:val="${options.style}"/>`);
  }

  if (typeof options?.spacingAfter === 'number') {
    pPrParts.push(`<w:spacing w:after="${options.spacingAfter}"/>`);
  }

  if (
    typeof options?.indentLeft === 'number' ||
    typeof options?.hanging === 'number'
  ) {
    pPrParts.push(
      `<w:ind ${
        typeof options.indentLeft === 'number'
          ? `w:left="${options.indentLeft}"`
          : ''
      } ${
        typeof options.hanging === 'number'
          ? `w:hanging="${options.hanging}"`
          : ''
      }/>`
    );
  }

  const pPr = pPrParts.length > 0 ? `<w:pPr>${pPrParts.join('')}</w:pPr>` : '';

  return `<w:p>${pPr}${content}</w:p>`;
}

function arrowParagraphXml(
  content: string,
  options?: { spacingAfter?: number }
): string {
  return paragraphXml(
    runXml('› ', { color: 'FF8300', fontSizeHalfPoints: 22 }) + content,
    {
      indentLeft: 360,
      hanging: 240,
      spacingAfter: options?.spacingAfter ?? 120,
    }
  );
}

function inlineNodesToRuns(
  nodes: ChildNode[],
  inherited?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
  }
): string {
  let xml = '';

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      xml += runXml(node.textContent || '', inherited);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') {
      xml += breakXml();
      return;
    }

    const next = { ...(inherited || {}) };

    if (tag === 'strong' || tag === 'b') {
      next.bold = true;
    }

    if (tag === 'em' || tag === 'i') {
      next.italic = true;
    }

    if (tag === 'u') {
      next.underline = true;
    }

    if (tag === 'a') {
      next.underline = true;
      next.color = '0563C1';
    }

    xml += inlineNodesToRuns(Array.from(el.childNodes), next);
  });

  return xml;
}

function listXml(list: HTMLElement, level = 0, ordered = false): string {
  const items = Array.from(list.children).filter(
    (child) => child.tagName.toLowerCase() === 'li'
  );

  return items
    .map((item, index) => {
      const childNodes = Array.from(item.childNodes);

      const inlineContentNodes = childNodes.filter((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return true;

        const tag = (node as HTMLElement).tagName.toLowerCase();
        return tag !== 'ul' && tag !== 'ol';
      });

      const nestedLists = childNodes.filter((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;

        const tag = (node as HTMLElement).tagName.toLowerCase();
        return tag === 'ul' || tag === 'ol';
      }) as HTMLElement[];

      const marker = ordered ? `${index + 1}. ` : '› ';
      const indentLeft = 360 + level * 360;

      const currentItemXml = paragraphXml(
        runXml(marker, { color: 'FF8300', fontSizeHalfPoints: 22 }) +
  inlineNodesToRuns(inlineContentNodes),
        {
          indentLeft,
          hanging: 240,
          spacingAfter: 80,
        }
      );

      const nestedXml = nestedLists
        .map((nested) =>
          listXml(nested, level + 1, nested.tagName.toLowerCase() === 'ol')
        )
        .join('');

      return currentItemXml + nestedXml;
    })
    .join('');
}

function htmlCellToWordXml(cell: Element): string {
  const children = Array.from(cell.childNodes);

  const blockTags = ['p', 'div', 'ul', 'ol', 'table', 'h1', 'h2', 'h3'];

  const hasBlockChildren = children.some((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;

    return blockTags.includes((node as HTMLElement).tagName.toLowerCase());
  });

  if (!hasBlockChildren) {
    const inlineContent = inlineNodesToRuns(children);

    return paragraphXml(inlineContent || runXml(''));
  }

  const convertedChildren = children
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();

        return text ? paragraphXml(runXml(text)) : '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'p' || tag === 'div') {
        const content = inlineNodesToRuns(Array.from(el.childNodes));

        return paragraphXml(content || runXml(''));
      }

      if (tag === 'h1') {
        return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
          style: 'Heading1',
          spacingAfter: 120,
        });
      }

      if (tag === 'h2') {
        return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
          style: 'Heading2',
          spacingAfter: 100,
        });
      }

      if (tag === 'h3') {
        return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
          style: 'Heading3',
          spacingAfter: 80,
        });
      }

      if (tag === 'ul') {
        return listXml(el, 0, false);
      }

      if (tag === 'ol') {
        return listXml(el, 0, true);
      }

      if (tag === 'table') {
        return tableXml(el as HTMLTableElement);
      }

      if (tag === 'br') {
        return paragraphXml(runXml(''));
      }

      return paragraphXml(
        inlineNodesToRuns(Array.from(el.childNodes)) || runXml('')
      );
    })
    .join('');

  return convertedChildren || paragraphXml(runXml(''));
}

function tableXml(table: HTMLTableElement): string {
  const rows = Array.from(table.querySelectorAll('tr'));

  const rowsXml = rows
    .map((row) => {
      const cells = Array.from(row.children).filter((child) => {
        const tag = child.tagName.toLowerCase();
        return tag === 'td' || tag === 'th';
      });

      const cellsXml = cells
        .map((cell) => {
          const isHeader = cell.tagName.toLowerCase() === 'th';
          const cellContent = htmlCellToWordXml(cell);

          return `
            <w:tc>
              <w:tcPr>
                <w:tcBorders>
                  <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                  <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                  <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                </w:tcBorders>
                ${isHeader ? '<w:shd w:fill="F2F2F2"/>' : ''}
              </w:tcPr>
              ${cellContent || paragraphXml(runXml(''))}
            </w:tc>
          `;
        })
        .join('');

      return `<w:tr>${cellsXml}</w:tr>`;
    })
    .join('');

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        </w:tblBorders>
      </w:tblPr>
      ${rowsXml}
    </w:tbl>
  `;
}

function htmlToWordXml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;

  if (!root) return '';

  const convertBlock = (node: ChildNode): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();

      if (!text) return '';

      return arrowParagraphXml(runXml(text), {
        spacingAfter: 120,
      });
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'h1') {
      return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
        style: 'Heading1',
        spacingAfter: 160,
      });
    }

    if (tag === 'h2') {
      return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
        style: 'Heading2',
        spacingAfter: 140,
      });
    }

    if (tag === 'h3') {
      return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
        style: 'Heading3',
        spacingAfter: 120,
      });
    }

    if (tag === 'p' || tag === 'div') {
      const content = inlineNodesToRuns(Array.from(el.childNodes));

      if (!content.trim()) {
        return paragraphXml(runXml(''));
      }

      return arrowParagraphXml(content, {
        spacingAfter: 120,
      });
    }

    if (tag === 'ul') {
      return listXml(el, 0, false);
    }

    if (tag === 'ol') {
      return listXml(el, 0, true);
    }

    if (tag === 'table') {
      return tableXml(el as HTMLTableElement);
    }

    if (tag === 'blockquote') {
      return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)), {
        indentLeft: 720,
        spacingAfter: 120,
      });
    }

    return Array.from(el.childNodes).map(convertBlock).join('');
  };

  return Array.from(root.childNodes).map(convertBlock).join('');
}

function getImageInfo(dataUrl: string): Promise<ImageInfo | null> {
  return new Promise((resolve) => {
    const match = dataUrl.match(/^data:image\/(png|jpg|jpeg|gif);base64,(.+)$/i);

    if (!match) {
      resolve(null);
      return;
    }

    const extension = match[1].toLowerCase() as 'png' | 'jpg' | 'jpeg' | 'gif';
    const base64 = match[2];

    const contentType =
      extension === 'jpg'
        ? 'image/jpeg'
        : extension === 'jpeg'
        ? 'image/jpeg'
        : extension === 'png'
        ? 'image/png'
        : 'image/gif';

    const img = new Image();

    img.onload = () => {
      resolve({
        dataUrl,
        extension,
        contentType,
        base64,
        widthPx: img.naturalWidth || 800,
        heightPx: img.naturalHeight || 450,
      });
    };

    img.onerror = () => {
      resolve({
        dataUrl,
        extension,
        contentType,
        base64,
        widthPx: 800,
        heightPx: 450,
      });
    };

    img.src = dataUrl;
  });
}

function calculateImageSizeEmu(
  widthPx: number,
  heightPx: number,
  maxWidthInches = 4.6
): { widthEmu: number; heightEmu: number } {
  const maxWidthPx = maxWidthInches * PX_PER_INCH;

  const scale = widthPx > maxWidthPx ? maxWidthPx / widthPx : 1;

  const displayWidthPx = widthPx * scale;
  const displayHeightPx = heightPx * scale;

  return {
    widthEmu: Math.round((displayWidthPx / PX_PER_INCH) * EMUS_PER_INCH),
    heightEmu: Math.round((displayHeightPx / PX_PER_INCH) * EMUS_PER_INCH),
  };
}

function ensureDocumentRelationshipsFile(zip: PizZip): string {
  const existing = zip.file('word/_rels/document.xml.rels')?.asText();

  if (existing) {
    return existing;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    </Relationships>`;
}

function addImageRelationship(
  relationshipsXml: string,
  relationshipId: string,
  target: string
): string {
  const relationshipXml = `
    <Relationship
      Id="${relationshipId}"
      Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
      Target="${target}"
    />`;

  return relationshipsXml.replace('</Relationships>', `${relationshipXml}</Relationships>`);
}

function ensureImageContentType(
  contentTypesXml: string,
  extension: string,
  contentType: string
): string {
  const normalizedExtension = extension === 'jpg' ? 'jpeg' : extension;

  if (contentTypesXml.includes(`Extension="${normalizedExtension}"`)) {
    return contentTypesXml;
  }

  const defaultXml = `<Default Extension="${normalizedExtension}" ContentType="${contentType}"/>`;

  return contentTypesXml.replace('</Types>', `${defaultXml}</Types>`);
}

function imageDrawingXml(
  relationshipId: string,
  imageName: string,
  widthEmu: number,
  heightEmu: number
): string {
  const docPrId = Math.floor(Math.random() * 1000000) + 1;

  return `
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="${docPrId}" name="${escapeXml(imageName)}"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks
                xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="${escapeXml(imageName)}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip
                      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                      r:embed="${relationshipId}"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${widthEmu}" cy="${heightEmu}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  `;
}

async function sectionImagesToWordXml(
  section: AutodocSection,
  context: ImageBuildContext
): Promise<string> {
  const images = section.images || [];

  if (images.length === 0) {
    return '';
  }

  let imageXml = '';

  for (const imageDataUrl of images) {
    const imageInfo = await getImageInfo(imageDataUrl);

    if (!imageInfo) {
      continue;
    }

    context.imageCounter += 1;

    const extensionForFile =
      imageInfo.extension === 'jpg' ? 'jpeg' : imageInfo.extension;

    const imageFileName = `autodoc-image-${context.imageCounter}.${extensionForFile}`;
    const relationshipId = `rIdAutodocImage${context.imageCounter}`;
    const mediaPath = `word/media/${imageFileName}`;

    context.zip.file(mediaPath, imageInfo.base64, { base64: true });

    context.relationships.push(
      JSON.stringify({
        relationshipId,
        target: `media/${imageFileName}`,
        extension: extensionForFile,
        contentType: imageInfo.contentType,
      })
    );

    const { widthEmu, heightEmu } = calculateImageSizeEmu(
      imageInfo.widthPx,
      imageInfo.heightPx,
      4.6
    );

    imageXml += imageDrawingXml(
      relationshipId,
      imageFileName,
      widthEmu,
      heightEmu
    );
  }

  return imageXml;
}

function replaceMarkerParagraph(
  xml: string,
  marker: string,
  replacementXml: string
): string {
  const paragraphs = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

  const markerParagraph = paragraphs.find((paragraph) =>
    paragraph.includes(marker)
  );

  if (!markerParagraph) {
    throw new Error(`Could not find ${marker} in the Word template row.`);
  }

  return xml.replace(markerParagraph, replacementXml);
}

function lockSectionTableLayout(documentXml: string, templateRowXml: string): string {
  const rowIndex = documentXml.indexOf(templateRowXml);

  if (rowIndex === -1) {
    return documentXml;
  }

  const tableStart = documentXml.lastIndexOf('<w:tbl>', rowIndex);
  const tableEnd = documentXml.indexOf('</w:tbl>', rowIndex);

  if (tableStart === -1 || tableEnd === -1) {
    return documentXml;
  }

  const tableXmlContent = documentXml.slice(
    tableStart,
    tableEnd + '</w:tbl>'.length
  );

  if (tableXmlContent.includes('<w:tblLayout')) {
    return documentXml;
  }

  const updatedTableXml = tableXmlContent.replace(
    '<w:tblPr>',
    '<w:tblPr><w:tblLayout w:type="fixed"/>'
  );

  return (
    documentXml.slice(0, tableStart) +
    updatedTableXml +
    documentXml.slice(tableEnd + '</w:tbl>'.length)
  );
}

async function replaceSectionTableRows(
  documentXml: string,
  sections: AutodocSection[],
  context: ImageBuildContext
): Promise<string> {
  const titleMarker = '[[SECTION_TITLE]]';
  const contentMarker = '[[SECTION_CONTENT]]';

  const escapedTitleMarker = titleMarker.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  const escapedContentMarker = contentMarker.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  const rowRegex = new RegExp(
    `<w:tr[\\s\\S]*?${escapedTitleMarker}[\\s\\S]*?${escapedContentMarker}[\\s\\S]*?<\\/w:tr>`
  );

  const match = documentXml.match(rowRegex);

  if (!match) {
    throw new Error(
      'Could not find a table row containing [[SECTION_TITLE]] and [[SECTION_CONTENT]]. Make sure both markers are in the same Word table row.'
    );
  }

  const templateRowXml = match[0];

  documentXml = lockSectionTableLayout(documentXml, templateRowXml);

  const generatedRows: string[] = [];

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const title = section.title || `Section ${index + 1}`;

    let rowXml = templateRowXml;

    rowXml = rowXml
  .split(titleMarker)
  .join(escapeXml(softenLongWords(title)));

    const contentXml =
      htmlToWordXml(section.content || '') +
      (await sectionImagesToWordXml(section, context));

    rowXml = replaceMarkerParagraph(
      rowXml,
      contentMarker,
      contentXml || paragraphXml(runXml(''))
    );

    generatedRows.push(rowXml);
  }

  return documentXml.replace(templateRowXml, generatedRows.join(''));
}

function applyImageRelationshipsAndContentTypes(
  zip: PizZip,
  context: ImageBuildContext
): void {
  if (context.relationships.length === 0) {
    return;
  }

  let relationshipsXml = ensureDocumentRelationshipsFile(zip);

  let contentTypesXml = zip.file('[Content_Types].xml')?.asText();

  if (!contentTypesXml) {
    throw new Error('Could not find [Content_Types].xml inside the Word template.');
  }

  context.relationships.forEach((relationshipJson) => {
    const relationship = JSON.parse(relationshipJson) as {
      relationshipId: string;
      target: string;
      extension: string;
      contentType: string;
    };

    relationshipsXml = addImageRelationship(
      relationshipsXml,
      relationship.relationshipId,
      relationship.target
    );

    contentTypesXml = ensureImageContentType(
      contentTypesXml!,
      relationship.extension,
      relationship.contentType
    );
  });

  zip.file('word/_rels/document.xml.rels', relationshipsXml);
  zip.file('[Content_Types].xml', contentTypesXml);
}

export async function generateAutodocDocx({
  documentTitle,
  sections,
  metadata,
}: GenerateAutodocDocxInput): Promise<void> {
  const response = await fetch(
    `/templates/autodoc-sow-template.docx?v=${Date.now()}`
  );

  if (!response.ok) {
    throw new Error(
      'Could not load the AUTODOC Word template. Check that public/templates/autodoc-sow-template.docx exists.'
    );
  }

  const templateArrayBuffer = await response.arrayBuffer();
  const zip = new PizZip(templateArrayBuffer);

  const documentFile = zip.file('word/document.xml');

  if (!documentFile) {
    throw new Error('Could not find word/document.xml inside the Word template.');
  }

  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const title = documentTitle || 'Untitled Statement of Work';

  const replacements: Record<string, string> = {
    DOCUMENT_TITLE: title,
    ORG_NAME: metadata.orgName || 'Client Organisation',
    CLIENT_NAME: metadata.clientName || 'Client Representative',
    CLIENT_EMAIL: metadata.clientEmail || '',
    USER_EMAIL: metadata.userEmail || 'Zenzero Consultant',
    ISSUE_DATE: issueDate,
  };

  const imageContext: ImageBuildContext = {
    zip,
    relationships: [],
    imageCounter: 0,
  };

  let documentXml = documentFile.asText();

  documentXml = replaceAllPlaceholders(documentXml, replacements);
  documentXml = await replaceSectionTableRows(documentXml, sections, imageContext);

  zip.file('word/document.xml', documentXml);

  const headerFooterFiles = zip.file(/^word\/(header|footer)\d+\.xml$/);

  headerFooterFiles.forEach((file) => {
    const originalXml = file.asText();
    const updatedXml = replaceAllPlaceholders(originalXml, replacements);
    zip.file(file.name, updatedXml);
  });

  applyImageRelationshipsAndContentTypes(zip, imageContext);

  const outputBlob = zip.generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  saveAs(outputBlob, `${safeFileName(title)}_Autodoc.docx`);
}