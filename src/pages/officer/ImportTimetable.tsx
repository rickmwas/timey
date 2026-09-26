import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ImportStatusBadge } from '../../components/ui/StatusBadge';
import { IMPORT_JOBS } from '../../data/mock';
import { formatFileSize, formatDateTime } from '../../lib/utils';
import type { ImportJob } from '../../types';

type Step = 'upload' | 'preview' | 'conflicts' | 'done';

const STAGED_PREVIEW = [
  { row: 1, course: 'CS 301', cohort: 'CS-2023-Y2-A', day: 'Monday', time: '08:00-10:00', venue: 'LH 1', lecturer: 'Dr. James Omondi', status: 'VALID' },
  { row: 2, course: 'CS 302', cohort: 'CS-2023-Y2-B', day: 'Monday', time: '10:00-12:00', venue: 'LH 2', lecturer: 'Prof. Mary Wanjiku', status: 'VALID' },
  { row: 3, course: 'CS 201', cohort: 'CS-2023-Y2-A', day: 'Monday', time: '08:00-10:00', venue: 'LH 1', lecturer: 'Dr. Peter Mutua', status: 'CONFLICT' },
  { row: 4, course: 'CS 203', cohort: 'CS-2023-Y2-A', day: 'Tuesday', time: '10:00-12:00', venue: 'LH 3', lecturer: 'Dr. James Omondi', status: 'CONFLICT' },
  { row: 5, course: 'BBA 301', cohort: 'BBA-2023-Y2', day: 'Wednesday', time: '14:00-16:00', venue: 'BBA HALL', lecturer: 'Mrs. Grace Akinyi', status: 'VALID' },
  { row: 6, course: 'MTH 201', cohort: 'CS-2023-Y2-B', day: 'Thursday', time: '08:00-10:00', venue: 'LH 5', lecturer: '', status: 'UNRESOLVED' },
  { row: 7, course: 'CS 401', cohort: 'CS-2022-Y3-A', day: 'Friday', time: '08:00-10:00', venue: 'CS LAB 2', lecturer: 'Dr. Faith Chebet', status: 'VALID' },
];

export function ImportTimetable() {
  const [jobs] = useState<ImportJob[]>(IMPORT_JOBS);
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setUploadedFile(file);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('preview');
    }, 1800);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleCommit() {
    setStep('done');
  }

  const statusIcon = (s: string) => {
    if (s === 'VALID') return <CheckCircle size={14} className="text-emerald-500" />;
    if (s === 'CONFLICT') return <XCircle size={14} className="text-red-500" />;
    return <AlertCircle size={14} className="text-amber-500" />;
  };

  const statusStyle = (s: string) => ({
    VALID: 'text-emerald-700',
    CONFLICT: 'text-red-700 bg-red-50',
    UNRESOLVED: 'text-amber-700 bg-amber-50',
  }[s] || '');

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Import Timetable' }]}>
      <div className="mb-5">
        <h1 className="font-display text-2xl text-slate-900">Import Timetable</h1>
        <p className="text-slate-500 text-sm">Upload CSV or Excel files to import timetable entries</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6 overflow-x-auto">
        {(['upload', 'preview', 'conflicts', 'done'] as Step[]).map((s, i) => {
          const labels = { upload: 'Upload', preview: 'Review', conflicts: 'Conflicts', done: 'Complete' };
          const isActive = s === step;
          const isDone = ['upload', 'preview', 'conflicts', 'done'].indexOf(s) < ['upload', 'preview', 'conflicts', 'done'].indexOf(step);
          return (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#1a2f5c] text-white' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-white text-[#1a2f5c]' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {isDone ? '✓' : i + 1}
                </span>
                {labels[s]}
              </div>
              {i < 3 && <div className="w-6 h-px bg-slate-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div className="max-w-xl">
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragging ? 'border-[#3b6fd4] bg-blue-50' : 'border-slate-300 hover:border-[#3b6fd4] hover:bg-slate-50'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} className="mx-auto text-slate-400 mb-3" />
            <p className="text-base font-medium text-slate-700">Drop your file here, or click to browse</p>
            <p className="text-sm text-slate-500 mt-1">Supports CSV and Excel (.xlsx, .xls) files</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {processing && (
            <Card className="mt-4 flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-[#3b6fd4] border-t-transparent rounded-full" />
              <div>
                <p className="text-sm font-medium text-slate-800">Processing {uploadedFile?.name}...</p>
                <p className="text-xs text-slate-500">Parsing and validating rows</p>
              </div>
            </Card>
          )}

          {/* Format guide */}
          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Expected CSV Format</h3>
            <code className="text-xs text-slate-600 bg-slate-50 p-2 rounded block">
              course_code, cohort_code, day, start_time, end_time, venue_code, lecturer_id
            </code>
          </Card>
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Rows', value: STAGED_PREVIEW.length, color: 'text-slate-900' },
              { label: 'Valid', value: STAGED_PREVIEW.filter(r => r.status === 'VALID').length, color: 'text-emerald-600' },
              { label: 'Conflicts', value: STAGED_PREVIEW.filter(r => r.status === 'CONFLICT').length, color: 'text-red-600' },
              { label: 'Unresolved', value: STAGED_PREVIEW.filter(r => r.status === 'UNRESOLVED').length, color: 'text-amber-600' },
            ].map(s => (
              <Card key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Preview table */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preview</h3>
              <span className="text-xs text-slate-500">{uploadedFile?.name}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Row', 'Course', 'Cohort', 'Day', 'Time', 'Venue', 'Lecturer', 'Status'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {STAGED_PREVIEW.map(row => (
                    <tr key={row.row} className={`${row.status === 'CONFLICT' ? 'bg-red-50' : row.status === 'UNRESOLVED' ? 'bg-amber-50' : ''}`}>
                      <td className="px-3 py-2 text-xs text-slate-400">{row.row}</td>
                      <td className="px-3 py-2 font-medium text-slate-900 text-xs">{row.course}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.cohort}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.day}</td>
                      <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">{row.time}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.venue}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.lecturer || <span className="text-amber-600">Missing</span>}</td>
                      <td className="px-3 py-2">
                        <span className={`flex items-center gap-1 text-xs font-medium ${statusStyle(row.status)}`}>
                          {statusIcon(row.status)} {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep('upload'); setUploadedFile(null); }}>Back</Button>
            <Button onClick={() => setStep('conflicts')}>Review Conflicts →</Button>
            <Button variant="danger" onClick={() => { setStep('upload'); setUploadedFile(null); }}>
              <Trash2 size={15} /> Discard
            </Button>
          </div>
        </div>
      )}

      {/* Conflicts step */}
      {step === 'conflicts' && (
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">2 Blocking Conflicts Detected</p>
                <p className="text-xs text-amber-700 mt-0.5">These conflicts must be resolved before committing the import. Resolve them by editing the source file and re-uploading, or manually after committing valid rows only.</p>
              </div>
            </div>
          </Card>

          {[
            {
              id: 1, type: 'VENUE_CONFLICT', severity: 'BLOCKING', row: 3,
              description: 'LH 1 is already allocated on Monday 08:00–10:00 to CS-2024-Y1-A (CS 101)',
              suggestion: 'Move CS 201 to LH 2 or a different time slot',
            },
            {
              id: 2, type: 'LECTURER_CONFLICT', severity: 'BLOCKING', row: 4,
              description: 'Dr. James Omondi already has CS 102 on Tuesday 10:00–12:00 in LH 2',
              suggestion: 'Assign CS 203 to a different lecturer or change the time',
            },
          ].map(c => (
            <Card key={c.id} className="border-red-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">BLOCKING</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Row {c.row} — {c.type.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-700 mt-1">{c.description}</p>
                  <p className="text-xs text-blue-600 mt-1.5">💡 {c.suggestion}</p>
                </div>
              </div>
            </Card>
          ))}

          <Card className="border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Commit Options</p>
            <p className="text-xs text-slate-500">Since blocking conflicts exist, you can only commit valid rows. Conflicting and unresolved rows will be skipped.</p>
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
              4 valid rows will be committed to the timetable
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
            <Button onClick={handleCommit}>Commit Valid Rows (4)</Button>
            <Button variant="danger" onClick={() => { setStep('upload'); setUploadedFile(null); }}>
              <Trash2 size={15} /> Discard Import
            </Button>
          </div>
        </div>
      )}

      {/* Done step */}
      {step === 'done' && (
        <Card className="max-w-md text-center py-10">
          <CheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Import Committed</h3>
          <p className="text-sm text-slate-500 mt-2">4 timetable entries have been successfully added. Affected users have been notified.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Button onClick={() => { setStep('upload'); setUploadedFile(null); }} variant="outline">Import Another</Button>
            <Button onClick={() => {}}>View Timetable</Button>
          </div>
        </Card>
      )}

      {/* Import history */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Import History</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['File', 'Uploaded By', 'Rows', 'Valid', 'Conflicts', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900 text-xs">{j.filename}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(j.fileSize)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{j.uploadedBy.name}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium text-xs">{j.totalRows}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium text-xs">{j.validRows}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={j.conflictRows > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>{j.conflictRows}</span>
                    </td>
                    <td className="px-4 py-3"><ImportStatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(j.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
