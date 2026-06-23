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
  }
): string {
  if (!text) return '';

  const hasFormatting =
    options?.bold || options?.italic || options?.underline || options?.color;

  const rPr = hasFormatting
    ? `<w:rPr>
        ${options?.bold ? '<w:b/>' : ''}
        ${options?.italic ? '<w:i/>' : ''}
        ${options?.underline ? '<w:u w:val="single"/>' : ''}
        ${options?.color ? `<w:color w:val="${options.color}"/>` : ''}
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

  return children
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
        return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)));
      }

      if (tag === 'ul') {
        return listXml(el, 0, false);
      }

      if (tag === 'ol') {
        return listXml(el, 0, true);
      }

      if (tag === 'br') {
        return paragraphXml(runXml(''));
      }

      return paragraphXml(inlineNodesToRuns(Array.from(el.childNodes)));
    })
    .join('');
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
      const indentLeft = 720 + level * 360;

      const currentItemXml = paragraphXml(
      runXml(marker, { color: 'F28C28' }) + inlineNodesToRuns(inlineContentNodes),
      {
        indentLeft,
        hanging: 360,
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

function htmlToWordXml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;

  if (!root) return '';

  const arrowRun = runXml('› ', {
    color: 'FF8300',
  });

  const convertBlock = (node: ChildNode): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();

      if (!text) return '';

      return paragraphXml(arrowRun + runXml(text), {
        spacingAfter: 120,
      });
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'h1') {
      return paragraphXml(arrowRun + inlineNodesToRuns(Array.from(el.childNodes)), {
        style: 'Heading1',
        spacingAfter: 160,
      });
    }

    if (tag === 'h2') {
      return paragraphXml(arrowRun + inlineNodesToRuns(Array.from(el.childNodes)), {
        style: 'Heading2',
        spacingAfter: 140,
      });
    }

    if (tag === 'h3') {
      return paragraphXml(arrowRun + inlineNodesToRuns(Array.from(el.childNodes)), {
        style: 'Heading3',
        spacingAfter: 120,
      });
    }

    if (tag === 'p' || tag === 'div') {
      const content = inlineNodesToRuns(Array.from(el.childNodes));

      if (!content.trim()) {
        return paragraphXml(runXml(''));
      }

      return paragraphXml(arrowRun + content, {
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
      return paragraphXml(arrowRun + inlineNodesToRuns(Array.from(el.childNodes)), {
        indentLeft: 720,
        spacingAfter: 120,
      });
    }

    return Array.from(el.childNodes).map(convertBlock).join('');
  };

  return Array.from(root.childNodes).map(convertBlock).join('');
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

  const tableXml = documentXml.slice(tableStart, tableEnd + '</w:tbl>'.length);

  if (tableXml.includes('<w:tblLayout')) {
    return documentXml;
  }

  const updatedTableXml = tableXml.replace(
    '<w:tblPr>',
    '<w:tblPr><w:tblLayout w:type="fixed"/>'
  );

  return (
    documentXml.slice(0, tableStart) +
    updatedTableXml +
    documentXml.slice(tableEnd + '</w:tbl>'.length)
  );
}

function softenLongWords(value: string, every = 18): string {
  return value.replace(new RegExp(`([^\\s]{${every}})`, 'g'), '$1\u200B');
}

function replaceSectionTableRows(
  documentXml: string,
  sections: AutodocSection[]
): string {
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

  const generatedRowsXml = sections
    .map((section, index) => {
      const title = section.title || `Section ${index + 1}`;

      let rowXml = templateRowXml;

      // Replace title marker only, preserving the styling of the title cell.
      rowXml = rowXml
        .split(titleMarker)
        .join(escapeXml(`${index + 1}. ${softenLongWords(title)}`));

      // Replace only the paragraph containing the content marker.
      rowXml = replaceMarkerParagraph(
        rowXml,
        contentMarker,
        htmlToWordXml(section.content || '')
      );

      return rowXml;
    })
    .join('');

  return documentXml.replace(templateRowXml, generatedRowsXml);
}

export async function generateAutodocDocx({
  documentTitle,
  sections,
  metadata,
}: GenerateAutodocDocxInput): Promise<void> {
  const response = await fetch('/templates/autodoc-sow-template.docx');

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

  let documentXml = documentFile.asText();

  documentXml = replaceAllPlaceholders(documentXml, replacements);
  documentXml = replaceSectionTableRows(documentXml, sections);

  zip.file('word/document.xml', documentXml);

  const headerFooterFiles = zip.file(/^word\/(header|footer)\d+\.xml$/);

  headerFooterFiles.forEach((file) => {
    const originalXml = file.asText();
    const updatedXml = replaceAllPlaceholders(originalXml, replacements);
    zip.file(file.name, updatedXml);
  });

  const outputBlob = zip.generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  saveAs(outputBlob, `${safeFileName(title)}_Autodoc.docx`);
}