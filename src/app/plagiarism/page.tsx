"use client";

import { useState, useRef, useCallback } from "react";

interface Match {
  text: string;
  similarity: number;
}

interface PlagiarismResult {
  similarityScore: number;
  analysis: string;
  matches: Match[];
}

export default function PlagiarismPage() {
  const [inputText, setInputText] = useState("");
  const [compareText, setCompareText] = useState("");
  const [mode, setMode] = useState<"auto" | "compare">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compareFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: (v: string) => void
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowed = ["txt", "pdf", "docx"];

      if (!ext || !allowed.includes(ext)) {
        setError("Unsupported file format. Use TXT, PDF, or DOCX.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to read file");
        }

        const data = await res.json();
        setter(data.text);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to read file"
        );
      }
    },
    []
  );

  const handleCheck = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Please enter or upload text to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/plagiarism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          compareWith: mode === "compare" ? compareText : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [inputText, compareText, mode]);

  const getScoreColor = (score: number) => {
    if (score < 30) return "text-green-600 dark:text-green-400";
    if (score < 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreStroke = (score: number) => {
    if (score < 30) return "stroke-green-500";
    if (score < 60) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          Plagiarism Detector
        </h1>
        <p className="mt-1 text-sm text-zinc-600 sm:text-base sm:mt-2 dark:text-zinc-400">
          Analyze content for originality. Get detailed similarity reports with
          highlighted matches and actionable insights.
        </p>
      </div>

      <div className="mb-6 flex gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => {
            setMode("auto");
            setResult(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            mode === "auto"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Analyze Text
        </button>
        <button
          onClick={() => {
            setMode("compare");
            setResult(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            mode === "compare"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Compare Two Texts
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Text to Analyze
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={(e) => handleFileUpload(e, setInputText)}
              className="hidden"
              id="file-upload-main"
            />
            <label
              htmlFor="file-upload-main"
              className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Upload file
            </label>
          </div>
          <textarea
            rows={8}
            placeholder="Paste the text you want to check for plagiarism..."
            className="w-full resize-none rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {mode === "compare" && (
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Compare Against
              </label>
              <input
                ref={compareFileRef}
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => handleFileUpload(e, setCompareText)}
                className="hidden"
                id="file-upload-compare"
              />
              <label
                htmlFor="file-upload-compare"
                className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Upload file
              </label>
            </div>
            <textarea
              rows={8}
              placeholder="Paste the source text to compare against..."
              className="w-full resize-none rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
              value={compareText}
              onChange={(e) => setCompareText(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleCheck}
          disabled={loading || !inputText.trim()}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              Check Plagiarism
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-zinc-200 dark:text-zinc-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={
                      2 * Math.PI * 42 * (1 - result.similarityScore / 100)
                    }
                    className={getScoreStroke(result.similarityScore)}
                  />
                </svg>
                <span
                  className={`absolute text-2xl font-bold ${getScoreColor(result.similarityScore)}`}
                >
                  {result.similarityScore}%
                </span>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Similarity Score
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {result.analysis}
                </p>
              </div>
            </div>
          </div>

          {result.matches.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Matches Found ({result.matches.length})
              </h3>
              <div className="space-y-3">
                {result.matches.map((match, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Match #{i + 1}
                      </span>
                      <span
                        className={`text-xs font-semibold ${getScoreColor(match.similarity)}`}
                      >
                        {match.similarity}% similar
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                        {match.text}
                      </p>
                      <div
                        className={`absolute bottom-0 left-0 h-1 ${getScoreColor(match.similarity).replace("text-", "bg-")}`}
                        style={{ width: `${match.similarity}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
