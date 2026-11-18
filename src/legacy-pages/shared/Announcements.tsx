"use client";

import { useState } from 'react';
import { Megaphone, Plus, Search } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { useApiCollection } from '../../hooks/use-api-collection';
import { apiRequest } from '../../lib/api-client';

type CatalogCohort = {
  id: string;
  code: string;
  name: string;
};

type ApiAnnouncement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; fullName: string };
  cohort: { id: string; code: string; name: string } | null;
  offering: { id: string; course: { id: string; code: string; title: string } } | null;
};

export function Announcements() {
  const { user } = useAuth();
  const canPost = user?.role === 'LECTURER' || user?.role === 'TIMETABLE_OFFICER' || user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetCohortId, setTargetCohortId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    items: announcements,
    isLoading,
    error,
    refresh,
  } = useApiCollection<ApiAnnouncement>('/api/v1/announcements');
  const { items: cohorts } = useApiCollection<CatalogCohort>('/api/v1/catalog/cohorts');

  const filtered = announcements.filter(a =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  async function handlePost() {
    if (!title.trim() || !content.trim() || !targetCohortId) return;
    setActionError(null);
    try {
      await apiRequest<{ announcement: ApiAnnouncement }>('/api/v1/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, content, cohortId: targetCohortId }),
      });
      await refresh();
      setShowModal(false);
      setTitle('');
      setContent('');
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Could not post announcement');
    }
  }

  return (
    <Layout breadcrumb={[{ label: 'Announcements' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm">{announcements.length} announcements</p>
        </div>
        {canPost && (
          <Button className="sm:ml-auto" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Post Announcement
          </Button>
        )}
      </div>

      {actionError && <p className="mb-4 text-sm text-red-700" role="alert">{actionError}</p>}
      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search announcements..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
        />
      </div>

      {isLoading ? (
        <Card className="py-12 text-center"><p role="status" className="text-sm text-slate-500">Loading announcements…</p></Card>
      ) : <div className="space-y-4">
        {filtered.map(a => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Megaphone size={18} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                  {a.cohort && (
                    <Badge variant="info" size="sm">
                      {a.cohort.code}
                    </Badge>
                  )}
                  {a.offering && (
                    <Badge variant="default" size="sm">
                      {a.offering.course.code}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{a.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{a.author.fullName}</span>
                  <span>·</span>
                  <span>{formatDate(a.createdAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="text-center py-12">
            <Megaphone size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No announcements found</p>
          </Card>
        )}
      </div>}

      {/* Post announcement modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Post Announcement"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { void handlePost(); }} disabled={!title.trim() || !content.trim() || !targetCohortId}>Post Announcement</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="Write your announcement..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4] resize-none"
            />
          </div>
          <Select
            label="Target Cohort"
            value={targetCohortId}
            onChange={event => setTargetCohortId(event.target.value)}
            options={[{ value: '', label: 'Choose a cohort' }, ...cohorts.map(cohort => ({ value: cohort.id, label: cohort.code }))]}
          />
        </div>
      </Modal>
    </Layout>
  );
}
