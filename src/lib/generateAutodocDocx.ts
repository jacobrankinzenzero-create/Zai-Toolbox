import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Word style IDs used by the AUTODOC template.
 *
 * These must match the internal Word style IDs in the .docx template.
 * The names below are the style names the user has created in Word:
 * - AUTODOCBulletLevel1: normal/top-level AUTODOC body bullet
 * - AUTODOCBulletLevel2: user-created bulleted lists
 * - AUTODOCNumberList1: user-created numbered lists
 */
const AUTODOC_BULLET_LEVEL_1_STYLE = 'AUTODOCBulletLevel1';
const AUTODOC_BULLET_LEVEL_2_STYLE = 'AUTODOCBulletLevel2';
const AUTODOC_NUMBER_LIST_1_STYLE = 'AUTODOCNumberList1';

const BODY_TEXT_COLOR = '242424';
const BODY_FONT_SIZE = 22;

/**
 * AUTODOC Word export generator.
 *
 * This file creates a real .docx file from a Word template stored in:
 *
 *   public/templates/autodoc-sow-template.docx
 *
 * It does this without paid Docxtemplater modules.
 *
 * How it works:
 * 1. Loads the .docx template as a zip file.
 * 2. Reads word/document.xml from inside the .docx.
 * 3. Replaces simple metadata markers such as [[DOCUMENT_TITLE]].
 * 4. Finds the Word table row containing [[SECTION_TITLE]] and [[SECTION_CONTENT]].
 * 5. Duplicates that row once per AUTODOC section.
 * 6. Converts rich editor HTML into Word XML.
 * 7. Adds images into word/media and links them through document.xml.rels.
 * 8. Saves the final .docx to the user's machine.
 *
 * Template requirements:
 * - Metadata placeholders should use square markers:
 *   [[DOCUMENT_TITLE]]
 *   [[ORG_NAME]]
 *   [[CLIENT_NAME]]
 *   [[CLIENT_EMAIL]]
 *   [[USER_EMAIL]]
 *   [[ISSUE_DATE]]
 *
 * - The repeating section area should be a Word table row containing:
 *   [[SECTION_TITLE]] in the left column
 *   [[SECTION_CONTENT]] in the right column
 *
 * Both section markers must be in the same Word table row.
 */

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
  documentType?: string;
  includeMetadataTable?: boolean;
  [key: string]: string | boolean | undefined;
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

type ImageRelationship = {
  relationshipId: string;
  target: string;
  extension: string;
  contentType: string;
};

type ImageBuildContext = {
  zip: PizZip;
  relationships: ImageRelationship[];
  imageCounter: number;
};

const EMUS_PER_INCH = 914400;
const PX_PER_INCH = 96;

/**
 * Escapes user/app text before placing it inside Word XML.
 *
 * Without this, characters like & or < could corrupt document.xml.
 */
function escapeXml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Makes the downloaded filename safe for Windows/macOS.
 */
function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '_')
    .trim();

  return cleaned || 'AUTODOC';
}

/**
 * Adds zero-width spaces into very long unbroken words.
 *
 * This stops long section titles from forcing the left table column wider.
 */
function softenLongWords(value: string, every = 18): string {
  return value.replace(new RegExp(`([^\\s]{${every}})`, 'g'), '$1\u200B');
}

/**
 * Replaces simple metadata markers in raw Word XML.
 *
 * Example:
 * [[ORG_NAME]] becomes the client organisation name.
 *
 * This is used for:
 * - word/document.xml
 * - word/header*.xml
 * - word/footer*.xml
 */
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

/**
 * Removes the whole Word paragraph containing a marker.
 *
 * Used for optional single-line placeholders such as [[DOCUMENT_TYPE]]. If no
 * document type/subtitle is supplied, removing the paragraph avoids leaving an
 * empty line above the document title.
 */
function removeParagraphContainingMarker(
  documentXml: string,
  marker: string
): string {
  const paragraphs = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

  const markerParagraph = paragraphs.find((paragraph) =>
    paragraph.includes(marker)
  );

  if (!markerParagraph) {
    return documentXml;
  }

  return documentXml.replace(markerParagraph, '');
}

/**
 * Gets the visible text from a chunk of Word XML.
 *
 * Word often splits placeholder text across multiple XML runs, so searching
 * the raw XML for [[METADATA_TABLE]] is not always reliable.
 *
 * By removing XML tags first, this can still detect the marker even when Word
 * has split it internally.
 */
function visibleTextFromWordXml(xml: string): string {
  return xml.replace(/<[^>]+>/g, '');
}

/**
 * Returns true when a Word XML block contains a marker.
 *
 * Checks both:
 * - raw XML, for simple placeholders
 * - visible text, for placeholders split across Word runs
 */
function wordXmlContainsMarker(xml: string, marker: string): boolean {
  return xml.includes(marker) || visibleTextFromWordXml(xml).includes(marker);
}

/**
 * Finds complete Word table ranges, including nested tables.
 *
 * A simple regex like /<w:tbl...<\/w:tbl>/ is not safe here because the
 * AUTODOC template contains nested Word tables in the cover-page header.
 * Removing a partial nested table corrupts the .docx and makes Word refuse to
 * open it.
 */
function getWordTableRanges(xml: string): { start: number; end: number; xml: string }[] {
  const tableTokenRegex = /<w:tbl\b[^>]*>|<\/w:tbl>/g;
  const stack: number[] = [];
  const ranges: { start: number; end: number; xml: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = tableTokenRegex.exec(xml)) !== null) {
    const token = match[0];

    if (token.startsWith('<w:tbl')) {
      stack.push(match.index);
      continue;
    }

    const start = stack.pop();

    if (typeof start === 'number') {
      const end = match.index + token.length;
      ranges.push({
        start,
        end,
        xml: xml.slice(start, end),
      });
    }
  }

  return ranges;
}

/**
 * Removes the smallest complete Word table containing a marker.
 *
 * Used for the optional metadata/version-control table. The marker should be
 * typed somewhere inside that metadata table, for example in a tiny final row:
 * [[METADATA_TABLE]]
 *
 * The function deliberately removes the smallest matching table. This matters
 * because Word templates can contain nested tables, especially inside headers.
 */
function removeTableContainingMarker(documentXml: string, marker: string): string {
  const matchingTable = getWordTableRanges(documentXml)
    .filter((tableRange) => wordXmlContainsMarker(tableRange.xml, marker))
    .sort((a, b) => a.xml.length - b.xml.length)[0];

  if (!matchingTable) {
    console.warn(
      `Could not find a complete Word table containing ${marker}. The metadata table was not removed.`
    );

    return documentXml;
  }

  return (
    documentXml.slice(0, matchingTable.start) +
    documentXml.slice(matchingTable.end)
  );
}

/**
 * Removes a simple marker while keeping the surrounding content.
 *
 * This is used when the metadata table is included, so the marker does not
 * appear in the final document.
 *
 * Note: if Word splits this marker across runs, it may not remove the split
 * version. That is harmless if the marker is hidden in a tiny cell/row, but
 * best practice is to type [[METADATA_TABLE]] as plain text in one go.
 */
function removeMarkerText(documentXml: string, marker: string): string {
  return documentXml.split(marker).join('');
}

/**
 * Creates a Word "run" of text.
 *
 * A run is Word's smallest text unit. We use runs for normal text,
 * bold text, italic text, links, coloured chevrons, etc.
 *
 * Word font sizes are in half-points:
 * 20 = 10pt
 * 22 = 11pt
 * 24 = 12pt
 */
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

  const hasFormatting = true;

  const rPr = hasFormatting
    ? `<w:rPr>
        ${options?.bold ? '<w:b/>' : ''}
        ${options?.italic ? '<w:i/>' : ''}
        ${options?.underline ? '<w:u w:val="single"/>' : ''}
        <w:color w:val="${options?.color || BODY_TEXT_COLOR}"/>
        <w:sz w:val="${options?.fontSizeHalfPoints || BODY_FONT_SIZE}"/>
      </w:rPr>`
    : '';

  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

/**
 * Creates a Word line break inside the current paragraph.
 */
function breakXml(): string {
  return '<w:r><w:br/></w:r>';
}

/**
 * Creates a Word paragraph.
 *
 * spacingAfter is measured in twentieths of a point.
 * indentLeft and hanging are measured in twips.
 */
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

  /**
   * Applies a Word paragraph style from the template.
   *
   * This is what lets the Word template control things like:
   * - orange chevrons
   * - grey secondary bullets
   * - numbered-list formatting
   * - indentation
   * - spacing
   *
   * Example:
   * style: 'AUTODOCBulletLevel2'
   * style: 'AUTODOCNumberList1'
   */
  if (options?.style) {
    pPrParts.push(`<w:pStyle w:val="${options.style}"/>`);
  }

  /**
   * Optional spacing override.
   *
   * Use this when you want consistent paragraph spacing.
   * If you want the Word style to control all spacing, remove this option
   * from the calling code instead of changing this function.
   */
  if (typeof options?.spacingAfter === 'number') {
    pPrParts.push(`<w:spacing w:after="${options.spacingAfter}"/>`);
  }

  /**
   * Optional manual indentation.
   *
   * Important:
   * For Word-template list styles such as:
   * - AUTODOCBulletLevel2
   * - AUTODOCNumberList1
   *
   * do NOT pass indentLeft or hanging, because that can override/fight
   * the indentation defined in the Word template style.
   */
  if (
    typeof options?.indentLeft === 'number' ||
    typeof options?.hanging === 'number'
  ) {
    const indentParts: string[] = [];

    if (typeof options.indentLeft === 'number') {
      indentParts.push(`w:left="${options.indentLeft}"`);
    }

    if (typeof options.hanging === 'number') {
      indentParts.push(`w:hanging="${options.hanging}"`);
    }

    pPrParts.push(`<w:ind ${indentParts.join(' ')}/>`);
  }

  const pPr =
    pPrParts.length > 0
      ? `<w:pPr>${pPrParts.join('')}</w:pPr>`
      : '';

  return `<w:p>${pPr}${content}</w:p>`;
}

/**
 * Creates a body paragraph using Word paragraph styles from the template.
 *
 * This is intentionally style-based, not character-based.
 * The .docx template owns the real visual bullet/chevron:
 * - AUTODOCBulletLevel1 should be the orange/top-level chevron style.
 * - AUTODOCBulletLevel2 should be the grey/secondary chevron style.
 *
 * If those internal Word style IDs change, update the constants near the top.
 */
function styledBodyParagraphXml(
  content: string,
  level: 1 | 2 = 1,
  options?: { spacingAfter?: number }
): string {
  return paragraphXml(content, {
    style:
      level === 1
        ? AUTODOC_BULLET_LEVEL_1_STYLE
        : AUTODOC_BULLET_LEVEL_2_STYLE,
    spacingAfter: options?.spacingAfter ?? 120,
  });
}

/**
 * Converts inline HTML nodes into Word text runs.
 *
 * Supported inline HTML:
 * - strong / b
 * - em / i
 * - u
 * - a
 * - br
 */
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

/**
 * Returns true if a node is a block-style HTML element.
 *
 * This matters because editor HTML often wraps real tables/lists inside divs.
 * If we treat those divs as inline text, tables get flattened.
 */
function isBlockElement(node: ChildNode): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const tag = (node as HTMLElement).tagName.toLowerCase();

  return [
    'p',
    'div',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tr',
    'h1',
    'h2',
    'h3',
    'blockquote',
  ].includes(tag);
}

/**
 * Checks whether an element contains block children.
 *
 * Used to decide whether a div should be treated as:
 * - one paragraph, or
 * - a wrapper around paragraphs/lists/tables
 */
function hasBlockChildren(element: Element): boolean {
  return Array.from(element.childNodes).some(isBlockElement);
}
/**
 * Extracts visible text/runs from a Tiptap list item.
 *
 * Tiptap commonly outputs list items like:
 *
 * <li>
 *   <p>Item text</p>
 *   <ul>Nested item</ul>
 * </li>
 *
 * This pulls the visible item text out of the <li>, while ignoring nested
 * <ul>/<ol> lists. Nested lists are handled separately by listXml().
 */
function listItemContentToRuns(item: Element): string {
  const childNodes = Array.from(item.childNodes);

  const contentNodes = childNodes.filter((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    const tag = (node as HTMLElement).tagName.toLowerCase();

    return tag !== 'ul' && tag !== 'ol';
  });

  let xml = '';

  contentNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      xml += runXml(node.textContent || '');
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'p' || tag === 'div') {
      xml += inlineNodesToRuns(Array.from(el.childNodes));
      return;
    }

    xml += inlineNodesToRuns([node]);
  });

  return xml;
}

/**
 * Converts HTML lists from Tiptap into Word paragraphs.
 *
 * Bulleted lists:
 * - apply AUTODOCBulletLevel2 from the Word template.
 *
 * Numbered lists:
 * - apply AUTODOCNumberList1 from the Word template.
 *
 * No bullet or number characters are manually rendered here. Word owns the
 * numbering/bullet appearance, indentation, spacing, and wrapping.
 */
function listXml(list: HTMLElement, level = 0, ordered = false): string {
  const items = Array.from(list.children).filter(
    (child) => child.tagName.toLowerCase() === 'li'
  );

  return items
    .map((item) => {
      const itemContent = listItemContentToRuns(item);

      const nestedLists = Array.from(item.childNodes).filter((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return false;
        }

        const tag = (node as HTMLElement).tagName.toLowerCase();

        return tag === 'ul' || tag === 'ol';
      }) as HTMLElement[];

      const listStyle = ordered
        ? AUTODOC_NUMBER_LIST_1_STYLE
        : AUTODOC_BULLET_LEVEL_2_STYLE;

      const currentItemXml = paragraphXml(itemContent || runXml(''), {
        style: listStyle,
        spacingAfter: 80,
      });

      const nestedXml = nestedLists
        .map((nested) =>
          listXml(nested, level + 1, nested.tagName.toLowerCase() === 'ol')
        )
        .join('');

      return currentItemXml + nestedXml;
    })
    .join('');
}

/**
 * Converts the content inside an HTML table cell into Word XML.
 *
 * This is more robust than treating a cell as one plain text line.
 * It allows table cells to contain paragraphs, lists, headings, and nested tables.
 */
function htmlCellToWordXml(cell: Element): string {
  const children = Array.from(cell.childNodes);

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

      if (tag === 'p') {
        const content = inlineNodesToRuns(Array.from(el.childNodes));
        return paragraphXml(content || runXml(''));
      }

      if (tag === 'div') {
        if (hasBlockChildren(el)) {
          return Array.from(el.childNodes)
            .map((child) => htmlCellToWordXml(child as Element))
            .join('');
        }

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

/**
 * Converts an HTML table into a real Word table.
 *
 * This is used for tables created in the AUTODOC rich text editor,
 * such as RACI matrices.
 *
 * Current limitations:
 * - No colspan / rowspan support yet.
 * - No HTML cell colour preservation yet.
 * - Columns are equal-width.
 */
function tableXml(table: HTMLTableElement): string {
  const rows = Array.from(table.rows);

  if (rows.length === 0) {
    return '';
  }

  const maxColumns = Math.max(
    ...rows.map((row) => {
      return Array.from(row.children).filter((child) => {
        const tag = child.tagName.toLowerCase();
        return tag === 'td' || tag === 'th';
      }).length;
    })
  );

  const tableWidthTwips = 7200;
  const columnWidthTwips = Math.floor(tableWidthTwips / Math.max(maxColumns, 1));

  const gridXml = Array.from({ length: maxColumns })
    .map(() => `<w:gridCol w:w="${columnWidthTwips}"/>`)
    .join('');

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
                <w:tcW w:w="${columnWidthTwips}" w:type="dxa"/>
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
        <w:tblW w:w="${tableWidthTwips}" w:type="dxa"/>
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
      <w:tblGrid>
        ${gridXml}
      </w:tblGrid>
      ${rowsXml}
    </w:tbl>
  `;
}

/**
 * Converts the AUTODOC rich text editor HTML into Word XML.
 *
 * This is the main HTML-to-Word converter.
 * Add new rich text support here if AUTODOC gains more editor features.
 */
function htmlToWordXml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;

  if (!root) return '';

  const convertBlock = (node: ChildNode): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();

      if (!text) return '';

      return styledBodyParagraphXml(runXml(text), 1, {
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

    if (tag === 'p') {
      const content = inlineNodesToRuns(Array.from(el.childNodes));

      if (!content.trim()) {
        return paragraphXml(runXml(''));
      }

      return styledBodyParagraphXml(content, 1, {
        spacingAfter: 120,
      });
    }

    if (tag === 'div') {
      if (hasBlockChildren(el)) {
        return Array.from(el.childNodes).map(convertBlock).join('');
      }

      const content = inlineNodesToRuns(Array.from(el.childNodes));

      if (!content.trim()) {
        return '';
      }

      return styledBodyParagraphXml(content, 1, {
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

    if (tag === 'br') {
      return paragraphXml(runXml(''));
    }

    return Array.from(el.childNodes).map(convertBlock).join('');
  };

  return Array.from(root.childNodes).map(convertBlock).join('');
}

/**
 * Reads a base64/data URL image and extracts useful information.
 *
 * Only data URLs are supported here:
 * data:image/png;base64,...
 * data:image/jpeg;base64,...
 */
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
      extension === 'jpg' || extension === 'jpeg'
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

/**
 * Converts image pixel dimensions into Word EMUs.
 *
 * EMUs are the unit Word uses for drawing/image dimensions.
 */
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

/**
 * Returns the document relationships XML.
 *
 * If the template does not already have one, this creates a minimal file.
 */
function ensureDocumentRelationshipsFile(zip: PizZip): string {
  const existing = zip.file('word/_rels/document.xml.rels')?.asText();

  if (existing) {
    return existing;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    </Relationships>`;
}

/**
 * Adds an image relationship to document.xml.rels.
 *
 * Word images need a relationship ID before document.xml can reference them.
 */
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

  return relationshipsXml.replace(
    '</Relationships>',
    `${relationshipXml}</Relationships>`
  );
}

/**
 * Ensures [Content_Types].xml knows about the image extension.
 *
 * Without this, Word may open the document but refuse to display the image.
 */
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

/**
 * Creates the Word drawing XML that displays an image.
 *
 * The image itself lives in word/media.
 * This XML points to it using a relationship ID such as rIdAutodocImage1.
 */
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
  <w:jc w:val="center"/>
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

/**
 * Converts section.images into Word image XML and adds each image to the docx zip.
 *
 * Images are placed after the section body text in the right-hand content cell.
 */
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

    context.relationships.push({
      relationshipId,
      target: `media/${imageFileName}`,
      extension: extensionForFile,
      contentType: imageInfo.contentType,
    });

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

/**
 * Replaces the exact Word paragraph that contains a marker.
 *
 * This is used for [[SECTION_CONTENT]], because the replacement may contain:
 * - multiple paragraphs
 * - tables
 * - images
 * - lists
 */
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

/**
 * Locks the section table layout.
 *
 * This helps stop Word expanding the left title column when titles are long.
 */
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

/**
 * Forces the duplicated AUTODOC section row cells to align top-left.
 *
 * This is useful because Word table cells can retain vertical centre alignment
 * even when the template visually appears to have been changed.
 *
 * We apply this to the template row before replacing [[SECTION_TITLE]]
 * and [[SECTION_CONTENT]].
 */
function forceTableRowCellsTopLeft(rowXml: string): string {
  return rowXml.replace(/<w:tc>[\s\S]*?<\/w:tc>/g, (cellXml) => {
    let updatedCellXml = cellXml;

    // Force vertical alignment to top.
    if (updatedCellXml.includes('<w:tcPr>')) {
      if (updatedCellXml.includes('<w:vAlign')) {
        updatedCellXml = updatedCellXml.replace(
          /<w:vAlign w:val="[^"]*"\/>/g,
          '<w:vAlign w:val="top"/>'
        );
      } else {
        updatedCellXml = updatedCellXml.replace(
          '<w:tcPr>',
          '<w:tcPr><w:vAlign w:val="top"/>'
        );
      }
    } else {
      updatedCellXml = updatedCellXml.replace(
        '<w:tc>',
        '<w:tc><w:tcPr><w:vAlign w:val="top"/></w:tcPr>'
      );
    }

    // Force any existing paragraph alignment in the template row to left.
    // This happens before generated content/images are inserted, so it will not
    // affect image centering added later by imageDrawingXml().
    updatedCellXml = updatedCellXml.replace(
      /<w:jc w:val="[^"]*"\/>/g,
      '<w:jc w:val="left"/>'
    );

    return updatedCellXml;
  });
}

/**
 * Finds the template table row containing:
 *
 *   [[SECTION_TITLE]]
 *   [[SECTION_CONTENT]]
 *
 * Then duplicates that row once per AUTODOC section.
 *
 * Left cell:
 * - Keeps the Word template styling.
 * - Replaces only the marker text.
 *
 * Right cell:
 * - Replaces the marker paragraph with generated Word XML.
 */
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

    rowXml = forceTableRowCellsTopLeft(rowXml);

    // Replace the title marker without adding numbers.
    // This keeps the left cell styling from the Word template.
    rowXml = rowXml
      .split(titleMarker)
      .join(escapeXml(softenLongWords(title)));

    // Convert rich text HTML and then append any section images.
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

/**
 * Writes image relationships and content types into the docx zip.
 *
 * This is called after all image XML/media has been prepared.
 */
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

  context.relationships.forEach((relationship) => {
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

/**
 * Main export function called by AUTODOC.
 *
 * This is the only function Autodoc.tsx should import from this file.
 */
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

  const documentType =
    typeof metadata.documentType === 'string'
      ? metadata.documentType.trim()
      : '';

  const replacements: Record<string, string> = {
    DOCUMENT_TITLE: title,
    DOCUMENT_TYPE: documentType,
    ORG_NAME: metadata.orgName || '',
    CLIENT_NAME: metadata.clientName || '',
    CLIENT_EMAIL: metadata.clientEmail || '',
    USER_EMAIL: metadata.userEmail || '',
    ISSUE_DATE: issueDate,
  };

  const imageContext: ImageBuildContext = {
    zip,
    relationships: [],
    imageCounter: 0,
  };

  let documentXml = documentFile.asText();

  // Remove optional blocks before replacing normal placeholders.
  if (!documentType) {
    documentXml = removeParagraphContainingMarker(
      documentXml,
      '[[DOCUMENT_TYPE]]'
    );
  }

  if (metadata.includeMetadataTable === false) {
    documentXml = removeTableContainingMarker(
      documentXml,
      '[[METADATA_TABLE]]'
    );
  } else {
    documentXml = removeMarkerText(documentXml, '[[METADATA_TABLE]]');
  }

  documentXml = replaceAllPlaceholders(documentXml, replacements);
  documentXml = await replaceSectionTableRows(
    documentXml,
    sections,
    imageContext
  );

  zip.file('word/document.xml', documentXml);

  // Replace metadata placeholders in headers and footers too.
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