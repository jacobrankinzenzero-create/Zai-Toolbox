import React, { useCallback, useEffect, useState } from 'react';
import './index.css';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { generateAutodocDocx } from './lib/generateAutodocDocx';
import type { TonePreset, Section, ExportData, ModalConfig } from './features/autodoc/types';
import { DEFAULT_EXPORT_DATA } from './features/autodoc/config/exportDefaults';
import { RECIPES, type RecipeKey } from './features/autodoc/config/recipes';
import ExportModal from './features/autodoc/components/ExportModal';
import SectionCard, { countWords } from './features/autodoc/components/SectionCard';

const AI_TONE_PRESETS: TonePreset[] = [
  {
    id: 'formal',
    name: '💼 Formal Corporate',
    systemInstruction:
      'Write in a professional, formal corporate tone suitable for legally binding agreements and high-value project stakeholders. Use clear, authoritative language.',
  },
  {
    id: 'technical',
    name: '🛠️ Technical Deep-Dive',
    systemInstruction:
      'Write with technical precision and rich engineering detail. Focus on architectural accuracy, technical steps, dependencies, and precise system parameters.',
  },
  {
    id: 'concise',
    name: '⚡ Agile & Concise',
    systemInstruction:
      'Write using direct, concise, and action-oriented phrasing. Use high-impact bullet points where possible. Avoid corporate jargon and filler words.',
  },
  {
    id: 'executive',
    name: '🎯 Executive Summary',
    systemInstruction:
      'Write from a strategic perspective, highlighting high-level business objectives, return on investment, milestones, and strategic alignment.',
  },
];

const IconPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const IconDownload = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const IconFileText = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const IconMenu = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const IconClose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const getInitialSections = (): Section[] => {
  const saved = localStorage.getItem('autodoc_sections');

  if (saved) {
    try {
      return JSON.parse(saved) as Section[];
    } catch {
      // Fall through to the default section if the stored JSON is invalid.
    }
  }

  return [
    {
      id: 'sec_1',
      title: 'Introduction',
      content:
        '<p>Start drafting your introduction here, or trigger the <strong>AI Assistant</strong> in this block to synthesize standard paragraphs dynamically.</p>',
      images: [],
      promptMode: false,
    },
  ];
};

const getInitialExportData = (): ExportData => {
  const saved = localStorage.getItem('autodoc_export_metadata');

  if (!saved) {
    return DEFAULT_EXPORT_DATA;
  }

  try {
    const parsed = JSON.parse(saved) as ExportData;

    return {
      ...DEFAULT_EXPORT_DATA,
      ...parsed,
      includeMetadataTable: parsed.includeMetadataTable !== false,
    };
  } catch {
    return DEFAULT_EXPORT_DATA;
  }
};

/**
 * AUTODOC document builder page.
 *
 * This file now acts as the page/controller for AUTODOC:
 * - document title/state
 * - recipe application
 * - draft save/load
 * - export modal setup
 * - Word export execution
 *
 * Larger UI chunks live in feature components so the main page stays readable.
 */
export default function App() {
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState<string>(() => {
    return localStorage.getItem('autodoc_title') || 'Untitled Document';
  });
  const [sections, setSections] = useState<Section[]>(getInitialSections);
  const [activeTone, setActiveTone] = useState<TonePreset>(AI_TONE_PRESETS[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [modalData, setModalData] = useState<ExportData>(DEFAULT_EXPORT_DATA);
  const [exportData, setExportData] = useState<ExportData>(getInitialExportData);

  useEffect(() => {
    localStorage.setItem('autodoc_title', documentTitle);
  }, [documentTitle]);

  useEffect(() => {
    try {
      const sectionsForStorage = sections.map((section) => ({
        ...section,
        images: [], // Do not persist base64 images to localStorage.
      }));

      localStorage.setItem(
        'autodoc_sections',
        JSON.stringify(sectionsForStorage)
      );
    } catch (error) {
      console.warn('Could not save AUTODOC sections to localStorage:', error);
    }
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('autodoc_export_metadata', JSON.stringify(exportData));
  }, [exportData]);

  const totalWords = sections.reduce(
    (accumulator, section) => accumulator + countWords(section.content),
    0
  );

  const addSection = useCallback(() => {
    setSections((previousSections) => [
      ...previousSections,
      {
        id: `sec_${Date.now()}`,
        title: 'New Section',
        content: '<p></p>',
        images: [],
        promptMode: false,
      },
    ]);
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((previousSections) =>
      previousSections.filter((section) => section.id !== id)
    );
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<Section>) => {
    setSections((previousSections) =>
      previousSections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      )
    );
  }, []);

  const moveSection = useCallback(
    (index: number, direction: number) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= sections.length) return;

      setSections((previousSections) => {
        const copiedSections = [...previousSections];
        const currentSection = copiedSections[index];
        copiedSections[index] = copiedSections[targetIndex];
        copiedSections[targetIndex] = currentSection;
        return copiedSections;
      });
    },
    [sections.length]
  );

  const applyRecipe = useCallback(
    (recipeKey: RecipeKey) => {
      const executeRecipe = () => {
        const recipe = RECIPES[recipeKey];

        setDocumentTitle(recipe.name);
        setExportData((current) => ({
          ...current,
          documentType: 'Statement of Work',
          includeMetadataTable: current.includeMetadataTable !== false,
        }));
        setSections(
          recipe.sections.map((section, index) => ({
            id: `recipe_sec_${Date.now()}_${index}`,
            title: section.title,
            content: section.content,
            images: [],
            promptMode: false,
          }))
        );
        setModalConfig(null);
        setMobileMenuOpen(false);
      };

      if (sections.length > 0) {
        setModalConfig({
          title: 'Replace with Template?',
          message:
            'Applying a template will overwrite your active workspace sections. Would you like to proceed?',
          confirmText: 'Overwrite & Apply',
          isDestructive: true,
          action: executeRecipe,
        });
      } else {
        executeRecipe();
      }
    },
    [sections.length]
  );

  const clearAllSections = useCallback(() => {
    if (sections.length === 0) return;

    setModalConfig({
      title: 'Reset Current Workspace?',
      message:
        'Are you sure you want to delete all sections and start over? This action is irreversible.',
      confirmText: 'Reset Workspace',
      isDestructive: true,
      action: () => {
        setSections([]);
        setDocumentTitle('Untitled Document');
        setModalConfig(null);
        setMobileMenuOpen(false);
      },
    });
  }, [sections.length]);

  const handleBackupExport = useCallback(() => {
    const backupData = {
      title: documentTitle,
      sections,
      metadata: exportData,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/\s+/g, '_')}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [documentTitle, sections, exportData]);

  const handleBackupImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = (readerEvent) => {
        try {
          const result = readerEvent.target?.result as string;
          const parsed = JSON.parse(result);

          if (parsed.title && Array.isArray(parsed.sections)) {
            setDocumentTitle(parsed.title);
            setSections(parsed.sections);

            if (parsed.metadata) {
              setExportData({
                ...DEFAULT_EXPORT_DATA,
                ...parsed.metadata,
                includeMetadataTable:
                  parsed.metadata.includeMetadataTable !== false,
              });
            }

            setMobileMenuOpen(false);
          } else {
            alert('Invalid backup file layout structure.');
          }
        } catch {
          alert('Could not parse JSON configuration.');
        }
      };

      reader.readAsText(file);
    },
    []
  );

  /**
   * Builds and downloads the Word document.
   *
   * The metadata payload controls:
   * - document cover placeholders
   * - document type / subtitle
   * - whether the generator loads the template with or without metadata table
   */
  const executeExport = useCallback(
    async (metadataOverride?: ExportData) => {
      try {
        await generateAutodocDocx({
          documentTitle,
          sections,
          metadata: metadataOverride || exportData,
        });
      } catch (error) {
        console.error(error);

        const message =
          error instanceof Error
            ? error.message
            : 'Could not generate the Word document.';

        alert(message);
      }
    },
    [documentTitle, sections, exportData]
  );

  const handleExportClick = useCallback(() => {
    setModalData({
      ...DEFAULT_EXPORT_DATA,
      ...exportData,
      includeMetadataTable: exportData.includeMetadataTable !== false,
    });

    setModalConfig({
      title: 'Export document details',
      message:
        'Review the document details below. The checkbox chooses between the full template and the no-metadata template.',
      inputs: [
        {
          id: 'documentType',
          label: 'Document type / subtitle',
          type: 'text',
          placeholder: 'e.g. Statement of Work, Proposal, Project Brief',
          required: false,
        },
        {
          id: 'userEmail',
          label: 'Zenzero contact',
          type: 'email',
          placeholder: 'yourname@zenzero.co.uk',
          required: false,
        },
        {
          id: 'orgName',
          label: 'Prepared for',
          type: 'text',
          placeholder: 'e.g. Client organisation',
          required: false,
        },
        {
          id: 'clientName',
          label: 'Client contact',
          type: 'text',
          placeholder: 'e.g. Jane Doe',
          required: false,
        },
        {
          id: 'clientEmail',
          label: 'Client contact email',
          type: 'email',
          placeholder: 'jane@acme.com',
          required: false,
        },
        {
          id: 'includeMetadataTable',
          label: 'Include document details table in final document',
          type: 'checkbox',
          required: false,
        },
      ],
      confirmText: 'Generate & Download',
      isDestructive: false,
      action: async (data) => {
        // Preserve false explicitly. This matters because the generator uses
        // includeMetadataTable === false to load the no-metadata template.
        const exportPayload: ExportData = {
          ...DEFAULT_EXPORT_DATA,
          ...data,
          includeMetadataTable: data.includeMetadataTable !== false,
        };

        setExportData(exportPayload);
        setModalConfig(null);
        await executeExport(exportPayload);
      },
    });
  }, [executeExport, exportData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-gray-800">
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black"
            style={{ background: 'linear-gradient(135deg, #ff8300, #ff5b00)' }}
          >
            ad
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900">
            autodoc
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to Toolbox"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      <div
        className={`w-full md:w-64 bg-white border-r border-gray-200 flex flex-col fixed md:h-screen z-20 shadow-sm transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen
            ? 'translate-x-0 top-[57px] bottom-0 h-[calc(100vh-57px)]'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="hidden md:flex p-6 border-b border-gray-100 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #ff8300, #ff4700)',
              }}
            >
              ad
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">
              autodoc
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Toolbox"
            aria-label="Back to Toolbox"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              AI tone
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {AI_TONE_PRESETS.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setActiveTone(tone)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all duration-200 font-medium ${
                    activeTone.id === tone.id
                      ? 'border-[#ff8300] bg-orange-50 text-[#ff8300] font-bold shadow-xs'
                      : 'border-transparent hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {tone.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Recipes
            </h3>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => applyRecipe('SOW_LEVEL_1')}
                className="w-full flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-[#ff8300] hover:bg-orange-50/50 transition-all text-left text-xs font-semibold text-gray-700"
              >
                <div className="text-[#ff8300] mr-2">
                  <IconFileText />
                </div>{' '}
                Level 1: Light SOW
              </button>
              <button
                type="button"
                onClick={() => applyRecipe('SOW_LEVEL_2')}
                className="w-full flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-[#ff8300] hover:bg-orange-50/50 transition-all text-left text-xs font-semibold text-gray-700"
              >
                <div className="text-[#ff8300] mr-2">
                  <IconFileText />
                </div>{' '}
                Level 2: Standard SOW
              </button>
              <button
                type="button"
                onClick={() => applyRecipe('SOW_LEVEL_3')}
                className="w-full flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-[#ff8300] hover:bg-orange-50/50 transition-all text-left text-xs font-semibold text-gray-700"
              >
                <div className="text-[#ff8300] mr-2">
                  <IconFileText />
                </div>{' '}
                Level 3: Enterprise SOW
              </button>
              <p className="text-[10px] text-gray-400 text-center mb-4 leading-relaxed">
                For more recipes, speak to your organisation. You can upload
                your own below via the <b>Local Backup</b> section.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Local Backup
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleBackupExport}
                className="py-2 text-center text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-semibold"
              >
                Save Draft
              </button>
              <label className="py-2 text-center text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-semibold block">
                Load Draft
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Metrics Log
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-gray-200/50">
                <div className="text-sm font-bold text-gray-800">
                  {sections.length}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">
                  Sections
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200/50">
                <div className="text-sm font-bold text-gray-800">
                  {totalWords}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">
                  Total Words
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleExportClick}
              className="w-full flex items-center justify-center p-3 mb-2.5 rounded-lg text-white shadow-sm transition-all font-semibold text-xs bg-[#ff8300] hover:bg-[#e67600] tracking-wide uppercase"
            >
              <span className="mr-1.5">
                <IconDownload />
              </span>{' '}
              Export Word Document
            </button>
            <p className="text-[10px] text-gray-400 text-center mb-4 leading-relaxed">
              Export builds a clean document from the selected AUTODOC Word
              template.
            </p>

            <button
              type="button"
              onClick={clearAllSections}
              disabled={sections.length === 0}
              className={`w-full flex items-center justify-center p-2.5 rounded-lg border transition-all font-semibold text-xs ${
                sections.length === 0
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50/50'
                  : 'border-red-100 text-red-500 hover:bg-red-50'
              }`}
            >
              <span className="mr-1.5">
                <IconTrash />
              </span>{' '}
              Clear Current Document
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 md:ml-64 flex flex-col items-center">
        <div className="w-full bg-white border-b border-gray-200 py-4 px-4 sm:px-8 sticky top-0 md:top-0 z-10 flex justify-center shadow-xs">
          <div className="max-w-4xl w-full flex items-center">
            <div className="text-gray-400 mr-3 hidden sm:block">
              <IconFileText />
            </div>
            <input
              type="text"
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              className="text-xl sm:text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none w-full"
              placeholder="Document Title"
            />
          </div>
        </div>

        <div className="w-full max-w-4xl py-6 sm:py-10 px-4 sm:px-8">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                totalSections={sections.length}
                updateSection={updateSection}
                removeSection={removeSection}
                moveSection={moveSection}
                activeTone={activeTone}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addSection}
            className="mt-6 w-full py-5 border-2 border-dashed border-gray-300 hover:border-[#ff8300] rounded-xl text-gray-500 hover:text-[#ff8300] hover:bg-orange-50/40 transition-all flex items-center justify-center font-bold text-sm gap-2"
          >
            <IconPlus /> Add Custom Section Block
          </button>

          {sections.length === 0 && (
            <div className="text-center py-24 text-gray-500">
              <div className="mx-auto text-gray-300 mb-4 flex justify-center scale-150">
                <IconFileText />
              </div>
              <p className="text-xl font-bold text-gray-800">
                Your Document Workspace is Empty
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                Generate comprehensive, industry-standard documents instantly by
                choosing one of the available document recipes on the sidebar
                menu.
              </p>
            </div>
          )}
        </div>
      </div>

      {modalConfig && (
        <ExportModal
          modalConfig={modalConfig}
          modalData={modalData}
          setModalData={setModalData}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
