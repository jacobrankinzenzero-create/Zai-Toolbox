import React, { memo, useCallback, useRef } from 'react';
import TiptapSectionEditor from '../../../components/TiptapSectionEditor';
import type { Section, TonePreset } from '../types';

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

const IconChevronUp = () => (
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
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const IconChevronDown = () => (
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
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const IconImage = () => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const IconInfo = () => (
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
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const countWords = (html?: string): number => {
  if (!html) return 0;

  const text = html.replace(/<[^>]*>/g, ' ');

  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

/**
 * Temporary AI content stub.
 *
 * Keep this client-side mock until the wider platform provides a secure Azure
 * OpenAI/Azure AI endpoint. API keys must not be placed in browser code.
 */
const generateAIContent = async (
  prompt: string,
  customInstruction: string
): Promise<string> => {
  const defaultInstruction =
    'You are a professional corporate document writer. Write professional, formal content fulfilling the request. IMPORTANT: Return the response formatted strictly as basic HTML using ONLY <p>, <ul>, <li>, <strong>, <em>, and <br> tags. Do not use Markdown. Do not include outer html tags, body tags, or CSS. Return only raw body-level HTML tags.';

  const instructionApplied = customInstruction
    ? `${defaultInstruction} ${customInstruction}`
    : defaultInstruction;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  await delay(1500);

  return `<p><em>[DEV TEAM: Replace this mock block with actual Azure AI payload response. System instruction applied.]</em></p><p>You requested: ${prompt}</p><p><em>Instruction context: ${instructionApplied}</em></p>`;
};

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

const RichTextEditor = memo(({ content, onChange }: RichTextEditorProps) => {
  return <TiptapSectionEditor content={content} onChange={onChange} />;
});

RichTextEditor.displayName = 'RichTextEditor';

type SectionCardProps = {
  section: Section;
  index: number;
  totalSections: number;
  updateSection: (id: string, updates: Partial<Section>) => void;
  removeSection: (id: string) => void;
  moveSection: (index: number, direction: number) => void;
  activeTone: TonePreset;
};

/**
 * One editable AUTODOC section.
 *
 * This component owns only the UI/interaction for a single section:
 * - title changes
 * - rich text editing
 * - image attachment/removal
 * - move/delete buttons
 * - temporary AI generation stub
 *
 * The parent page still owns the real document state.
 */
const SectionCard: React.FC<SectionCardProps> = memo(
  ({
    section,
    index,
    totalSections,
    updateSection,
    removeSection,
    moveSection,
    activeTone,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wordCount = countWords(section.content);

    const handleTitleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) =>
        updateSection(section.id, { title: event.target.value }),
      [section.id, updateSection]
    );

    const handleContentChange = useCallback(
      (content: string) => updateSection(section.id, { content }),
      [section.id, updateSection]
    );

    const handleImageUpload = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onloadend = () => {
          updateSection(section.id, {
            images: [...(section.images || []), reader.result as string],
          });
        };

        reader.readAsDataURL(file);
      },
      [section.id, section.images, updateSection]
    );

    const handleRemoveImage = useCallback(
      (indexToRemove: number) => {
        const newImages = (section.images || []).filter(
          (_, imageIndex) => imageIndex !== indexToRemove
        );

        updateSection(section.id, { images: newImages });
      },
      [section.id, section.images, updateSection]
    );

    const triggerAIGeneration = useCallback(
      async (promptText: string) => {
        updateSection(section.id, { isGenerating: true, error: null });

        try {
          const promptContext = `Please write a highly detailed professional document section with title: "${section.title}". Use the following guidelines: "${promptText}".`;
          const generatedHtml = await generateAIContent(
            promptContext,
            activeTone.systemInstruction
          );

          updateSection(section.id, {
            content: generatedHtml,
            isGenerating: false,
            promptMode: false,
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : 'AI Generation failed. Check backend connection.';

          updateSection(section.id, {
            isGenerating: false,
            error: message,
          });
        }
      },
      [section.id, section.title, activeTone, updateSection]
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 group hover:shadow-md transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center flex-1 gap-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveSection(index, -1)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Move Section Up"
              >
                <IconChevronUp />
              </button>
              <button
                type="button"
                disabled={index === totalSections - 1}
                onClick={() => moveSection(index, 1)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Move Section Down"
              >
                <IconChevronDown />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-md">
                #{index + 1}
              </span>
              <input
                type="text"
                value={section.title}
                onChange={handleTitleChange}
                placeholder="Section Title"
                className="text-base font-semibold text-gray-800 bg-transparent border-none focus:outline-none w-full placeholder-gray-300 focus:ring-1 focus:ring-orange-100 rounded px-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
              {wordCount} words
            </span>
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50"
              title="Delete Section"
            >
              <IconTrash />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <RichTextEditor
            content={section.content}
            onChange={handleContentChange}
          />

          {section.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3.5 rounded-lg border border-red-100 flex items-start gap-2">
              <span className="mt-0.5 text-red-500 flex-shrink-0">
                <IconInfo />
              </span>
              <div>
                <p className="font-semibold">Generation Problem</p>
                <p className="text-xs mt-0.5">{section.error}</p>
              </div>
            </div>
          )}

          {section.promptMode && (
            <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-xs text-gray-600">
              AI prompt mode is currently disabled in the UI until the Azure
              endpoint is connected. The local stub remains in this component
              for the dev team to wire up later.
              <button
                type="button"
                onClick={() => triggerAIGeneration('Draft this section.')}
                disabled={section.isGenerating}
                className="ml-2 font-semibold text-[#ff8300] hover:underline disabled:opacity-40"
              >
                Generate test content
              </button>
            </div>
          )}

          <div className="pt-2">
            {section.images && section.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {section.images.map((img, imageIndex) => (
                  <div key={imageIndex} className="relative group/img">
                    <img
                      src={img}
                      alt="Attachment"
                      className="h-20 w-auto rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imageIndex)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white shadow-md rounded-full p-1 hover:bg-red-600 transition-all scale-90"
                      title="Remove attachment"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold flex items-center text-gray-500 hover:text-[#ff8300] transition-colors gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <IconImage /> Attach Asset / Sketch
            </button>
          </div>
        </div>
      </div>
    );
  }
);

SectionCard.displayName = 'SectionCard';

export default SectionCard;
