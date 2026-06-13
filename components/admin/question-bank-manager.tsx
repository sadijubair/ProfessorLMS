'use client';

import { useState } from 'react';
import { Upload, PlusCircle, Download, FileSpreadsheet, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type CourseOption = {
  id: string;
  title: string;
};

export function QuestionBankManager({ courses }: { courses: CourseOption[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [csv, setCsv] = useState('');

  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);

  const clearFile = () => {
    setFileName(null);
    setParsedCount(null);
    setCsv('');
  };

  const handleFile = (file: File) => {
    if (importing) return;
    if (!file.name.endsWith('.csv')) {
      setStatus('Please upload a valid CSV file.');
      return;
    }
    setFileName(file.name);
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsv(text);
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      setParsedCount(lines.length > 1 ? lines.length - 1 : 0);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (importing) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (importing) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (importing) return;
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 'content,subject,topic,difficulty_level,exam_year,option_a,option_b,option_c,option_d,correct_option,explanation,solution';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_questions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function createQuestion(formData: FormData) {
    setStatus(null);
    setCreating(true);

    try {
      const options = ['A', 'B', 'C', 'D']
        .map((label) => ({
          label,
          text: String(formData.get(`option${label}`) || ''),
          isCorrect: formData.get('correctOption') === label,
        }))
        .filter((option) => option.text);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: formData.get('courseId'),
          type: 'mcq',
          content: formData.get('content'),
          explanation: formData.get('explanation'),
          solution: formData.get('solution'),
          difficultyLevel: formData.get('difficultyLevel'),
          subject: formData.get('subject'),
          topic: formData.get('topic'),
          examYear: formData.get('examYear') ? Number(formData.get('examYear')) : null,
          options,
        }),
      });

      const payload = await response.json();
      setStatus(response.ok ? 'Question created.' : payload.error || 'Question creation failed');
    } catch {
      setStatus('An error occurred.');
    } finally {
      setCreating(false);
    }
  }

  async function importCsv(formData: FormData) {
    setStatus(null);
    setImporting(true);

    try {
      const response = await fetch('/api/questions/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: formData.get('courseId'),
          csv,
        }),
      });

      const payload = await response.json();
      if (response.ok) {
        setStatus(`Imported ${payload.count} questions.`);
        clearFile();
      } else {
        setStatus(payload.error || 'Import failed');
      }
    } catch {
      setStatus('Import failed due to server error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={createQuestion} className="space-y-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-lg font-semibold">Add Question</h2>
          <p className="text-sm text-muted-foreground">Create an MCQ with explanation and solution.</p>
        </div>

        <label className="block space-y-2 text-sm font-medium">
          Course
          <select name="courseId" className="h-10 w-full rounded-md border bg-background px-3" required>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Question
          <Textarea name="content" required />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="subject" placeholder="Subject" />
          <Input name="topic" placeholder="Topic" />
          <select name="difficultyLevel" className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="medium">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <Input name="examYear" type="number" placeholder="Exam year" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {['A', 'B', 'C', 'D'].map((label) => (
            <Input key={label} name={`option${label}`} placeholder={`Option ${label}`} />
          ))}
        </div>

        <label className="block space-y-2 text-sm font-medium">
          Correct option
          <select name="correctOption" className="h-10 w-full rounded-md border bg-background px-3" defaultValue="A">
            {['A', 'B', 'C', 'D'].map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <Textarea name="explanation" placeholder="Explanation" />
        <Textarea name="solution" placeholder="Solution" />

        <Button type="submit" disabled={creating}>
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving question...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Save question
            </>
          )}
        </Button>
      </form>

      <form action={importCsv} className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Bulk CSV Import</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Import questions using a CSV file. Make sure your file matches the required headers.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSampleCsv}
            className="shrink-0 gap-1.5"
          >
            <Download className="h-4 w-4" />
            Sample CSV
          </Button>
        </div>

        {/* Toggle between Upload File and Paste CSV */}
        <div className="flex gap-1.5 border-b border-border/40 pb-2">
          <button
            type="button"
            disabled={importing}
            onClick={() => { if (!importing) { setImportMode('upload'); clearFile(); } }}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              importMode === 'upload' ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
              importing ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            Upload File
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={() => { if (!importing) { setImportMode('paste'); clearFile(); } }}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              importMode === 'paste' ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
              importing ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            Paste CSV Text
          </button>
        </div>

        <label className="block space-y-2 text-sm font-medium">
          Fallback course
          <select name="courseId" disabled={importing} className="h-10 w-full rounded-md border bg-background px-3 disabled:opacity-50 disabled:cursor-not-allowed">
            <option value="">Use course_id column</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        {importMode === 'upload' ? (
          <div>
            {!fileName ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed border-border/60 rounded-lg p-8 text-center cursor-pointer transition-all hover:bg-muted/10 hover:border-primary/40",
                  dragActive ? "border-primary bg-primary/5 scale-[0.99]" : "",
                  importing ? "opacity-50 cursor-not-allowed" : ""
                )}
                onClick={() => { if (!importing) document.getElementById('csv-file-input')?.click(); }}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={importing}
                />
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">Only .csv files are supported</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{parsedCount} questions detected</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  disabled={importing}
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Textarea
            value={csv}
            disabled={importing}
            onChange={(event) => setCsv(event.target.value)}
            className="min-h-72 font-mono text-xs disabled:opacity-50"
            placeholder="content,subject,topic,difficulty_level,option_a,option_b,option_c,option_d,correct_option"
          />
        )}

        {importing && (
          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-primary">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving questions to database...
              </span>
              <span>Processing</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-5/6 rounded-full transition-all duration-1000" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
        )}

        <Button type="submit" disabled={!csv || importing} className="w-full">
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Importing questions...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import questions
            </>
          )}
        </Button>
      </form>

      {status ? (
        <div className="rounded-md border bg-card p-4 text-sm lg:col-span-2">{status}</div>
      ) : null}
    </div>
  );
}
