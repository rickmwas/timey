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
import { ANNOUNCEMENTS, COHORTS, COURSES } from '../../data/mock';
import { formatDate } from '../../lib/utils';

export function Announcements() {
  const { user } = useAuth();
  const canPost = user?.role === 'TIMETABLE_OFFICER' || user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);

  const filtered = announcements.filter(a =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  function handlePost() {
    if (!title.trim() || !content.trim() || !user) return;
    const newAnnouncement = {
      id: `an${Date.now()}`,
      authorId: user.id,
      author: { id: user.id, identifier: user.identifier, name: user.name, email: user.email, role: user.role, active: true, createdAt: new Date().toISOString() },
      title,
      content,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnnouncement as typeof prev[0], ...prev]);
    setShowModal(false);
    setTitle('');
    setContent('');
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

      <div className="space-y-4">
        {filtered.map(a => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Megaphone size={18} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                  {a.targetCohortId && (
                    <Badge variant="info" size="sm">
                      {COHORTS.find(c => c.id === a.targetCohortId)?.code || 'Cohort'}
                    </Badge>
                  )}
                  {a.targetCourseId && (
                    <Badge variant="default" size="sm">
                      {COURSES.find(c => c.id === a.targetCourseId)?.code || 'Course'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{a.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{a.author.name}</span>
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
      </div>

      {/* Post announcement modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Post Announcement"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePost} disabled={!title.trim() || !content.trim()}>Post Announcement</Button>
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
          <div className="grid grid-cols-2 gap-4">
            <Select label="Target Cohort (optional)" value="" onChange={() => {}} options={[{ value: '', label: 'All cohorts' }, ...COHORTS.map(c => ({ value: c.id, label: c.code }))]} />
            <Select label="Target Course (optional)" value="" onChange={() => {}} options={[{ value: '', label: 'All courses' }, ...COURSES.map(c => ({ value: c.id, label: c.code }))]} />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
