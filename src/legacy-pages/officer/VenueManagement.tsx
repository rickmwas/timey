"use client";

import { useState } from 'react';
import { Search, Plus, MapPin, Check, X } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { VENUES, TIMETABLE_ENTRIES } from '../../data/mock';
import type { Venue } from '../../types';

export function VenueManagement() {
  const [venues, setVenues] = useState<Venue[]>(VENUES);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const filtered = venues.filter(v =>
    !search ||
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.building.toLowerCase().includes(search.toLowerCase())
  );

  function getVenueUsage(venueId: string) {
    return TIMETABLE_ENTRIES.filter(e => e.venueId === venueId && e.status === 'ACTIVE').length;
  }

  function toggleActive(venueId: string) {
    setVenues(prev => prev.map(v => v.id === venueId ? { ...v, active: !v.active } : v));
  }

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Venues' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Venue Management</h1>
          <p className="text-slate-500 text-sm">{venues.filter(v => v.active).length} active venues · {venues.length} total</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => { setSelectedVenue(null); setShowModal(true); }}>
          <Plus size={16} /> Add Venue
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{venues.filter(v => v.active).length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Venues</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{venues.filter(v => !v.active).length}</p>
          <p className="text-xs text-slate-500 mt-1">Inactive Venues</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{venues.reduce((s, v) => s + v.capacity, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Capacity</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search venues..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
        />
      </div>

      {/* Venue grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => {
          const usage = getVenueUsage(v.id);
          const utilization = Math.round((usage / (5 * 4)) * 100);
          return (
            <Card key={v.id} className={`hover:shadow-md transition-shadow ${!v.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin size={18} className="text-[#3b6fd4]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{v.code}</h3>
                    <p className="text-xs text-slate-500">{v.building}</p>
                  </div>
                </div>
                <Badge variant={v.active ? 'success' : 'outline'}>
                  {v.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-slate-700 mb-1">{v.name}</p>
              <p className="text-xs text-slate-500 mb-3">{v.floor}</p>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Capacity: <strong className="text-slate-900">{v.capacity}</strong></span>
                <span>Classes: <strong className="text-slate-900">{usage}</strong>/week</span>
              </div>

              {/* Utilization bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Utilization</span>
                  <span>{Math.min(utilization, 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
              </div>

              {v.aliases.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {v.aliases.map(a => (
                    <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{a}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedVenue(v); setShowModal(true); }}>
                  Edit
                </Button>
                <Button variant={v.active ? 'secondary' : 'ghost'} size="sm" onClick={() => toggleActive(v.id)}>
                  {v.active ? <X size={14} /> : <Check size={14} />}
                  {v.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">No venues match your search</div>
      )}

      {/* Add/Edit Venue Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedVenue ? 'Edit Venue' : 'Add Venue'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowModal(false)}>Save Venue</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Venue Code" defaultValue={selectedVenue?.code} placeholder="e.g. LH 1" />
            <Input label="Venue Name" defaultValue={selectedVenue?.name} placeholder="e.g. Lecture Hall 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Building" defaultValue={selectedVenue?.building} placeholder="e.g. Main Block" />
            <Input label="Floor" defaultValue={selectedVenue?.floor} placeholder="e.g. Ground Floor" />
          </div>
          <Input label="Capacity" type="number" defaultValue={selectedVenue?.capacity} min={1} />
          <Input label="Aliases (comma separated)" defaultValue={selectedVenue?.aliases.join(', ')} placeholder="e.g. Main LH1, Science Hall" />
        </div>
      </Modal>
    </Layout>
  );
}
