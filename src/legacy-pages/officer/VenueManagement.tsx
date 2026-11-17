"use client";

import { useState } from 'react';
import { Search, Plus, MapPin, X } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useApiCollection } from '../../hooks/use-api-collection';
import { apiRequest } from '../../lib/api-client';

type ApiVenue = {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  isActive: boolean;
  isUnderMaintenance: boolean;
};

export function VenueManagement() {
  const { items: venues, isLoading, error, refresh } = useApiCollection<ApiVenue>('/api/v1/venues');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<ApiVenue | null>(null);
  const [form, setForm] = useState({ code: '', name: '', building: '', floor: '1', capacity: '100' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = venues.filter(v =>
    !search ||
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.building.toLowerCase().includes(search.toLowerCase())
  );

  function openForm(venue: ApiVenue | null) {
    setSelectedVenue(venue);
    setForm({
      code: venue?.code ?? '',
      name: venue?.name ?? '',
      building: venue?.building ?? '',
      floor: String(venue?.floor ?? 1),
      capacity: String(venue?.capacity ?? 100),
    });
    setActionError(null);
    setShowModal(true);
  }

  async function saveVenue() {
    setSaving(true);
    setActionError(null);
    try {
      const body = {
        code: form.code.trim(),
        name: form.name.trim(),
        building: form.building.trim(),
        floor: Number(form.floor),
        capacity: Number(form.capacity),
      };
      await apiRequest(
        selectedVenue ? `/api/v1/venues/${selectedVenue.id}` : '/api/v1/venues',
        {
          method: selectedVenue ? 'PATCH' : 'POST',
          body: JSON.stringify(body),
        },
      );
      await refresh();
      setShowModal(false);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Could not save venue');
    } finally {
      setSaving(false);
    }
  }

  async function deactivateVenue(venueId: string) {
    setActionError(null);
    try {
      await apiRequest(`/api/v1/venues/${venueId}`, { method: 'DELETE' });
      await refresh();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Could not disable venue');
    }
  }

  const activeVenues = venues.filter(v => v.isActive);
  const inactiveVenues = venues.filter(v => !v.isActive);

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Venues' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Venue Management</h1>
          <p className="text-slate-500 text-sm">{activeVenues.length} active venues · {venues.length} total</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => openForm(null)}>
          <Plus size={16} /> Add Venue
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{activeVenues.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Venues</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{inactiveVenues.length}</p>
          <p className="text-xs text-slate-500 mt-1">Inactive Venues</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{venues.reduce((s, v) => s + v.capacity, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Capacity</p>
        </Card>
      </div>

      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}
      {actionError && !showModal && <p className="mb-4 text-sm text-red-700" role="alert">{actionError}</p>}
      {isLoading && <Card className="mb-4 py-6 text-center"><p role="status" className="text-sm text-slate-500">Loading venues…</p></Card>}

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
      {!isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => {
          return (
            <Card key={v.id} className={`hover:shadow-md transition-shadow ${!v.isActive ? 'opacity-60' : ''}`}>
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
                <Badge variant={v.isActive ? 'success' : 'outline'}>
                  {v.isUnderMaintenance ? 'Maintenance' : v.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-slate-700 mb-1">{v.name}</p>
              <p className="text-xs text-slate-500 mb-3">Floor {v.floor}</p>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Capacity: <strong className="text-slate-900">{v.capacity}</strong> seats</span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openForm(v)}>
                  Edit
                </Button>
                {v.isActive && <Button variant="secondary" size="sm" onClick={() => { void deactivateVenue(v.id); }}>
                  <X size={14} /> Disable
                </Button>}
              </div>
            </Card>
          );
        })}
      </div>}

      {!isLoading && filtered.length === 0 && (
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
            <Button size="sm" loading={saving} onClick={() => { void saveVenue(); }} disabled={!form.code.trim() || !form.name.trim() || !form.building.trim()}>Save Venue</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Venue Code" value={form.code} onChange={event => setForm(prev => ({ ...prev, code: event.target.value }))} placeholder="e.g. LH 1" />
            <Input label="Venue Name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="e.g. Lecture Hall 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Building" value={form.building} onChange={event => setForm(prev => ({ ...prev, building: event.target.value }))} placeholder="e.g. Main Block" />
            <Input label="Floor" type="number" value={form.floor} onChange={event => setForm(prev => ({ ...prev, floor: event.target.value }))} min={0} />
          </div>
          <Input label="Capacity" type="number" value={form.capacity} onChange={event => setForm(prev => ({ ...prev, capacity: event.target.value }))} min={1} />
          {actionError && <p className="text-sm text-red-700" role="alert">{actionError}</p>}
        </div>
      </Modal>
    </Layout>
  );
}
