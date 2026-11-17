import React, { useRef } from 'react';
import { FileCheck2, UploadCloud, X } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  fileName: string;
  onChange: (fileName: string) => void;
  accept?: string;
  hint?: string;
  sampleFileName?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  fileName,
  onChange,
  accept = '.pdf,.jpg,.jpeg,.png',
  hint = 'PDF, JPG or PNG up to 10 MB',
  sampleFileName = 'Vendor_GST_Invoice_Scan.pdf',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-xs font-medium text-[#20252D] mb-1.5">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f.name);
        }}
      />

      {fileName ? (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA]">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span className="text-xs font-medium text-[#20252D] truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove file"
            className="p-1 text-[#707987] hover:text-[#DC2626] rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F7F8FA]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <UploadCloud className="w-4 h-4 text-[#172B4D] shrink-0" />
            <div>
              <div className="text-xs font-medium text-[#172B4D] group-hover:underline">
                Choose file or capture photo
              </div>
              <div className="text-[11px] text-[#707987]">{hint}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onChange(sampleFileName)}
            className="text-[11px] font-medium text-[#172B4D] px-2.5 py-1.5 rounded-md border border-[#E6E9EF] bg-white hover:bg-[#F0F2F5] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Attach sample bill
          </button>
        </div>
      )}
    </div>
  );
};
