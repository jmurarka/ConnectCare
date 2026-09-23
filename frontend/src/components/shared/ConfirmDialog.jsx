import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-gray-900">
            {isDanger ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <AlertTriangle className="w-5 h-5 text-[#174A7E]" />}
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">{message}</p>

        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-semibold text-xs rounded-lg transition-colors ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#174A7E] hover:bg-[#12395F]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
