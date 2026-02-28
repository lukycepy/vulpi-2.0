"use client";

import { useState } from "react";
import { Upload, FileText, Check, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { processReceipt, OCRResult } from "@/actions/ocr";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await processReceipt(formData);
      setResult(data);
    } catch (err) {
      setError("Nepodařilo se zpracovat účtenku. Zkuste to prosím znovu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Vytěžování účtenek</h1>
        <p className="text-muted-foreground">
          Nahrajte účtenku nebo fakturu a umělá inteligence automaticky rozpozná klíčové údaje.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors bg-card">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="receipt-upload"
            />
            <label
              htmlFor="receipt-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <span className="font-semibold text-primary hover:underline">
                  Klikněte pro nahrání
                </span>{" "}
                nebo přetáhněte soubor
              </div>
              <p className="text-sm text-muted-foreground">
                PNG, JPG nebo PDF (max. 10MB)
              </p>
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Zpracovávám...
                  </>
                ) : (
                  "Vytěžit data"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-900 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/20 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Zde se zobrazí vytěžená data z účtenky</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-muted-foreground animate-pulse">Analýza dokumentu...</p>
            </div>
          )}

          {result && (
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Úspěšně vytěženo</span>
                </div>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                  Jistota {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Dodavatel</label>
                    <p className="font-medium text-lg">{result.supplierName}</p>
                    <p className="text-sm text-muted-foreground">IČ: {result.ico}</p>
                  </div>
                  <div className="text-right">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Celkem</label>
                    <p className="font-bold text-2xl text-primary">
                      {formatCurrency(result.amount, result.currency)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Datum vystavení</label>
                  <p className="font-medium">{formatDate(result.date)}</p>
                </div>

                <div className="pt-4 border-t flex flex-col gap-2">
                    <Link 
                        href={`/expenses/new?amount=${result.amount}&currency=${result.currency}&date=${result.date.toISOString()}&supplier=${encodeURIComponent(result.supplierName)}`}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center"
                    >
                        Vytvořit výdaj
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                    <button disabled className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium opacity-50 cursor-not-allowed">
                        Vytvořit přijatou fakturu (Brzy)
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
