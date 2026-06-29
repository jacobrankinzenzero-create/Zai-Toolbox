import React from 'react';
import type { ExportData, ModalConfig } from '../types';

type ExportModalProps = {
  modalConfig: ModalConfig;
  modalData: ExportData;
  setModalData: React.Dispatch<React.SetStateAction<ExportData>>;
  onCancel: () => void;
};

/**
 * Shared confirmation/export modal used by AUTODOC.
 *
 * This component is intentionally generic. It can render:
 * - destructive confirmation prompts
 * - export metadata forms
 * - checkbox options such as includeMetadataTable
 *
 * The parent page owns the actual action logic. This keeps the modal reusable
 * and stops the main Autodoc page from being filled with form JSX.
 */
export default function ExportModal({
  modalConfig,
  modalData,
  setModalData,
  onCancel,
}: ExportModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {modalConfig.title}
        </h3>
        <p className="text-gray-500 text-xs mb-4">{modalConfig.message}</p>

        {modalConfig.inputs && (
          <div className="space-y-3.5 mb-2">
            {modalConfig.inputs.map((input) => {
              if (input.type === 'checkbox') {
                return (
                  <label
                    key={input.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={modalData[input.id] !== false}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          [input.id]: e.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#ff8300] focus:ring-[#ff8300]"
                    />
                    <span>{input.label}</span>
                  </label>
                );
              }

              return (
                <div key={input.id}>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {input.label}
                  </label>
                  <input
                    type={input.type}
                    placeholder={input.placeholder}
                    value={String(modalData[input.id] || '')}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        [input.id]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8300]/20 focus:border-[#ff8300] text-sm"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => modalConfig.action(modalData)}
            disabled={false}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              modalConfig.isDestructive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[#ff8300] hover:bg-[#e67600]'
            }`}
          >
            {modalConfig.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
