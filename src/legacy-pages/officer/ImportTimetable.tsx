"use client";

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ImportStatusBadge } from '../../components/ui/StatusBadge';
import { formatFileSize, formatDateTime } from '../../lib/utils';
import { apiRequest } from '../../lib/api-client';
import { useApiCollection } from '../../hooks/use-api-collection';

type Step = 'upload' | 'preview' | 'conflicts' | 'done';

type ImportJob = {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  totalRows: number;
  validRows: number;
  conflictRows: number;
  version: number;
  createdAt: string;
  createdBy: { id: string; fullName: string };
};

type StagedEntry = {
  id: string;
  rawRowIndex: number;
  rawCourseCode: string | null;
  rawCohort: string | null;
  rawDay: string | null;
  rawTime: string | null;
  rawVenue: string | null;
  rawLecturer: string | null;
  normalizedDay: string | null;
  normalizedStartTime: string | null;
  normalizedEndTime: string | null;
  validationStatus: string;
  errors: string[];
  conflicts: Array<{ type?: string; description?: string; message?: string }>;
};

type ImportDetail = ImportJob & { periodId: string; stagedEntries: StagedEntry[] };
type AcademicPeriod = { id: string; name: string };

export function ImportTimetable() {
  const { items: jobs, isLoading: jobsLoading, error: jobsError, refresh: refreshJobs } =
    useApiCollection<ImportJob>('/api/v1/imports');
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [period, setPeriod] = useState<AcademicPeriod | null>(null);
  const [activeJob, setActiveJob] = useState<ImportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void apiRequest<{ period: AcademicPeriod }>('/api/v1/catalog/academic-period')
      .then(result => setPeriod(result.period))
      .catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Could not load active academic period'));
  }, []);

  async function loadJob(jobId: string) {
    const result = await apiRequest<{ job: ImportDetail }>(`/api/v1/imports/${jobId}`);
    setActiveJob(result.job);
    return result.job;
  }

  async function handleFile(file: File) {
    if (!period) {
      setError('There is no active academic period for this import.');
      return;
    }
    setError(null);
    setUploadedFile(file);
    setProcessing(true);
    try {
      const form = new FormData();
      form.append('periodId', period.id);
      form.append('file', file);
      const created = await apiRequest<{ job: ImportJob }>('/api/v1/imports', {
        method: 'POST',
        body: form,
      });
      await loadJob(created.job.id);
      setStep('preview');
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not upload this file');
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleValidate() {
    if (!activeJob) return;
    setProcessing(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/imports/${activeJob.id}/validate`, {
        method: 'POST',
        body: JSON.stringify({ expectedVersion: activeJob.version }),
      });
      await loadJob(activeJob.id);
      setStep('conflicts');
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not validate this import');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCommit() {
    if (!activeJob) return;
    setProcessing(true);
    setError(null);
    try {
      await apiRequest(`/api/v1/imports/${activeJob.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ expectedVersion: activeJob.version }),
      });
      await refreshJobs();
      setStep('done');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not publish this import');
    } finally {
      setProcessing(false);
    }
  }

  async function discardActiveJob() {
    if (!activeJob) {
      setStep('upload');
      setUploadedFile(null);
      return;
    }
    setError(null);
    try {
      await apiRequest(`/api/v1/imports/${activeJob.id}/discard`, {
        method: 'POST',
        body: JSON.stringify({ expectedVersion: activeJob.version }),
      });
      setActiveJob(null);
      setUploadedFile(null);
      setStep('upload');
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not discard this import');
    }
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
        <p className="text-slate-500 text-sm">
          {period ? `${period.name} · Upload a CSV or Excel timetable` : 'Loading the active academic period…'}
        </p>
      </div>

      {error && <Card className="mb-4 border-red-200 text-sm text-red-700" role="alert">{error}</Card>}

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
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" disabled={!period || processing} onChange={e => e.target.files?.[0] && void handleFile(e.target.files[0])} />
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
      {step === 'preview' && activeJob && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Rows', value: activeJob.totalRows, color: 'text-slate-900' },
              { label: 'Valid', value: activeJob.validRows, color: 'text-emerald-600' },
              { label: 'Conflicts', value: activeJob.conflictRows, color: 'text-red-600' },
              { label: 'Unresolved', value: activeJob.stagedEntries.filter(row => row.validationStatus === 'INVALID').length, color: 'text-amber-600' },
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
              <span className="text-xs text-slate-500">{activeJob.fileName}</span>
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
                  {activeJob.stagedEntries.map(row => (
                    <tr key={row.id} className={`${row.validationStatus === 'CONFLICT' ? 'bg-red-50' : row.validationStatus === 'INVALID' ? 'bg-amber-50' : ''}`}>
                      <td className="px-3 py-2 text-xs text-slate-400">{row.rawRowIndex}</td>
                      <td className="px-3 py-2 font-medium text-slate-900 text-xs">{row.rawCourseCode ?? 'Missing'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.rawCohort ?? 'Missing'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.normalizedDay ?? row.rawDay ?? 'Missing'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                        {row.normalizedStartTime && row.normalizedEndTime ? `${row.normalizedStartTime} to ${row.normalizedEndTime}` : row.rawTime ?? 'Missing'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.rawVenue ?? 'Missing'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.rawLecturer ?? <span className="text-amber-600">Missing</span>}</td>
                      <td className="px-3 py-2">
                        <span className={`flex items-center gap-1 text-xs font-medium ${statusStyle(row.validationStatus)}`}>
                          {statusIcon(row.validationStatus)} {row.validationStatus}
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
            <Button loading={processing} onClick={() => { void handleValidate(); }}>Validate timetable</Button>
            <Button variant="danger" onClick={() => { void discardActiveJob(); }}>
              <Trash2 size={15} /> Discard
            </Button>
          </div>
        </div>
      )}

      {/* Conflicts step */}
      {step === 'conflicts' && activeJob && (
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {activeJob.conflictRows} conflicts and {activeJob.stagedEntries.filter(row => row.validationStatus === 'INVALID').length} invalid rows
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Publishing replaces the active timetable, so every row must validate without conflicts.
                </p>
              </div>
            </div>
          </Card>

          {activeJob.stagedEntries
            .filter(row => row.validationStatus === 'CONFLICT' || row.validationStatus === 'INVALID')
            .map(row => (
            <Card key={row.id} className="border-red-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">{row.validationStatus}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Row {row.rawRowIndex}</p>
                  {[...row.errors, ...row.conflicts.map(conflict => conflict.description ?? conflict.message ?? conflict.type ?? 'Schedule conflict')].map((message, index) => (
                    <p key={index} className="text-sm text-slate-700 mt-1">{message}</p>
                  ))}
                </div>
              </div>
            </Card>
          ))}

          <Card className="border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Publish check</p>
            <p className="text-xs text-slate-500">
              {activeJob.validRows} of {activeJob.totalRows} rows are valid. All rows must be valid before publishing.
            </p>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
            <Button loading={processing} disabled={activeJob.validRows !== activeJob.totalRows || activeJob.conflictRows > 0} onClick={() => { void handleCommit(); }}>
              Publish timetable
            </Button>
            <Button variant="danger" onClick={() => { void discardActiveJob(); }}>
              <Trash2 size={15} /> Discard Import
            </Button>
          </div>
        </div>
      )}

      {/* Done step */}
      {step === 'done' && (
        <Card className="max-w-md text-center py-10">
          <CheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Import published</h3>
          <p className="text-sm text-slate-500 mt-2">{activeJob?.validRows ?? 0} timetable entries have been published. Affected users have been notified.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Button onClick={() => { setStep('upload'); setUploadedFile(null); setActiveJob(null); }} variant="outline">Import Another</Button>
            <Button
  onClick={() => {
    window.location.href = "/timetable";
  }}
>
  View Timetable
</Button>
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
                          <p className="font-medium text-slate-900 text-xs">{j.fileName}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(j.fileSize)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{j.createdBy.fullName}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium text-xs">{j.totalRows}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium text-xs">{j.validRows}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={j.conflictRows > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>{j.conflictRows}</span>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs">{j.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(j.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobsLoading && <p className="p-4 text-sm text-slate-500" role="status">Loading imports…</p>}
            {jobsError && <p className="p-4 text-sm text-red-700" role="alert">{jobsError}</p>}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
