import type { ExportData } from '../types';

/**
 * Default export metadata.
 *
 * This object is used in three places:
 * 1. First page load, when there is no saved metadata yet.
 * 2. Opening the export modal, so missing fields are filled consistently.
 * 3. Creating the export payload sent to generateAutodocDocx().
 *
 * includeMetadataTable defaults to true because the full corporate cover page
 * should be included unless the user explicitly unticks the checkbox.
 */
export const DEFAULT_EXPORT_DATA: ExportData = {
  userEmail: '',
  orgName: '',
  clientName: '',
  clientEmail: '',
  documentType: '',
  includeMetadataTable: true,
};
