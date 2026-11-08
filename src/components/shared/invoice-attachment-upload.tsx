'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceAttachmentUploadProps {
  attachments: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxFiles?: number;
}

export function InvoiceAttachmentUpload({
  attachments,
  onChange,
  folder = 'shopnear_finance/invoices',
  maxFiles = 5,
}: InvoiceAttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast.error(`You can upload at most ${maxFiles} attachments.`);
      return;
    }

    try {
      setUploading(true);

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || `Failed to upload ${file.name}`);
        }

        uploadedUrls.push(json.data.url);
      }

      onChange([...attachments, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} file(s) uploaded to Cloudinary successfully.`);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading file to Cloudinary');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = attachments.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Invoice / Purchase Bill Pictures (Cloudinary)
        </label>
        <span className="text-[11px] text-slate-400">
          {attachments.length} / {maxFiles} uploaded
        </span>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
          uploading
            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 cursor-wait'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          multiple
          onChange={handleFileChange}
          disabled={uploading || attachments.length >= maxFiles}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Uploading picture to Cloudinary...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to upload invoice picture
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports JPG, PNG, WEBP, and PDF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Previews */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {attachments.map((url, idx) => {
            const isPdf = url.toLowerCase().endsWith('.pdf');
            return (
              <div
                key={idx}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm overflow-hidden"
              >
                {isPdf ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center h-20 w-full bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 p-2"
                  >
                    <ImageIcon className="h-6 w-6 text-red-500 mb-1" />
                    <span className="text-[10px] font-mono truncate w-full text-center">PDF Document</span>
                  </a>
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block h-20 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={url}
                      alt={`Invoice attachment ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-sm"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
