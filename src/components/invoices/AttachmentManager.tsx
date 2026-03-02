"use client";

import { useState, useRef } from "react";
import { Attachment } from "@prisma/client";
import { uploadAttachment, deleteAttachment } from "@/actions/attachment";
import { formatBytes, formatDate } from "@/lib/format";
import { Paperclip, Trash2, FileText, Download, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

interface AttachmentManagerProps {
  invoiceId: string;
  isLocked: boolean;
  attachments: Attachment[];
}

export function AttachmentManager({ invoiceId, isLocked, attachments }: AttachmentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Maximální velikost souboru je 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("invoiceId", invoiceId);

    try {
      await uploadAttachment(formData);
      router.refresh();
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      alert("Chyba při nahrávání souboru: " + (error instanceof Error ? error.message : "Neznámá chyba"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Opravdu chcete smazat tuto přílohu?")) return;

    setIsDeleting(attachmentId);
    try {
      await deleteAttachment(attachmentId);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Chyba při mazání přílohy: " + (error instanceof Error ? error.message : "Neznámá chyba"));
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Přílohy
        </h3>
        {!isLocked && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded flex items-center gap-2 transition-colors"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Nahrát přílohu
            </button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
          Žádné přílohy
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" title={attachment.filename}>
                    {attachment.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(attachment.size)} • {formatDate(attachment.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Stáhnout"
                >
                  <Download className="w-4 h-4" />
                </a>
                {!isLocked && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={isDeleting === attachment.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Smazat"
                  >
                    {isDeleting === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
