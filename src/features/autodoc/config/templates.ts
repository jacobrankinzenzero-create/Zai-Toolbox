/**
 * Default AUTODOC Word template filenames.
 *
 * Keep these names aligned with the files in public/templates/.
 * The Word exporter currently keeps its own constants too; this config file is
 * the future source of truth when the generator is moved into the feature folder.
 */
export const AUTODOC_TEMPLATE_FILES = {
  withMetadata: 'autodoc-default-template.docx',
  withoutMetadata: 'autodoc-default-template-no-metadata.docx',
} as const;
