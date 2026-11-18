"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MapPin, Check, X, WifiOff } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api-client';
import { VENUES, TIMETABLE_ENTRIES } from '../../data/mock';
import type { Venue } from '../../types';

export function VenueManagement() {
  const { mode } = useAuth();
  const [venues, setVenues] = useState<Venue[]>(VENUES);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formFloor, setFormFloor] = useState('0');
  const [formCapacity, setFormCapacity] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    if (mode === 'mock') {
      setVenues(VENUES);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.venues.list({ limit: 100 });
      if (res && Array.isArray(res.items)) {
        const mapped: Venue[] = res.items.map((v: any) => ({
          id: v.id,
          code: v.code,
          name: v.name,
          building: v.building,
          floor: v.floor != null ? `Floor ${v.floor}` : 'Ground Floor',
          capacity: v.capacity || 50,
          active: v.isActive ?? true,
          aliases: [],
        }));
        setVenues(mapped.length > 0 ? mapped : VENUES);
        setIsOffline(false);
      }
    } catch {
      setIsOffline(true);
      setVenues(VENUES);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  function handleOpenModal(venue?: Venue) {
    if (venue) {
      setSelectedVenue(venue);
      setFormCode(venue.code);
      setFormName(venue.name);
      setFormBuilding(venue.building);
      const floorNum = venue.floor ? venue.floor.replace(/\D/g, '') || '0' : '0';
      setFormFloor(floorNum);
      setFormCapacity(String(venue.capacity));
    } else {
      setSelectedVenue(null);
      setFormCode('');
      setFormName('');
      setFormBuilding('Science & Computing Complex');
      setFormFloor('1');
      setFormCapacity('60');
    }
    setFormError(null);
    setShowModal(true);
  }

  async function handleSaveVenue() {
    if (!formCode.trim() || !formName.trim() || !formBuilding.trim()) {
      setFormError('Please fill in code, name, and building.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const floorInt = parseInt(formFloor, 10) || 0;
    const capacityInt = parseInt(formCapacity, 10) || 50;

    try {
      if (mode !== 'mock' && !isOffline) {
        if (selectedVenue) {
          await apiClient.venues.update(selectedVenue.id, {
            name: formName,
            building: formBuilding,
            floor: floorInt,
            capacity: capacityInt,
          });
        } else {
          await apiClient.venues.create({
            code: formCode,
            name: formName,
            building: formBuilding,
            floor: floorInt,
            capacity: capacityInt,
          });
        }
        await fetchVenues();
      } else {
        // Local state update for mock mode
        if (selectedVenue) {
          setVenues(prev =>
            prev.map(v =>
              v.id === selectedVenue.id
                ? {
                    ...v,
                    code: formCode,
                    name: formName,
                    building: formBuilding,
                    floor: `Floor ${floorInt}`,
                    capacity: capacityInt,
                  }
                : v
            )
          );
        } else {
          const newVenue: Venue = {
            id: `v-${Date.now()}`,
            code: formCode,
            name: formName,
            building: formBuilding,
            floor: `Floor ${floorInt}`,
            capacity: capacityInt,
            active: true,
            aliases: [],
          };
          setVenues(prev => [newVenue, ...prev]);
        }
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save venue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(venue: Venue) {
    const nextActive = !venue.active;
    // Optimistic update
    setVenues(prev => prev.map(v => (v.id === venue.id ? { ...v, active: nextActive } : v)));

    if (mode !== 'mock' && !isOffline) {
      try {
        await apiClient.venues.update(venue.id, { isActive: nextActive });
      } catch (e) {
        console.warn('Failed to update venue status on server:', e);
      }
    }
  }

  const filtered = venues.filter(v =>
    !search ||
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.building.toLowerCase().includes(search.toLowerCase())
  );

  function getVenueUsage(venueId: string) {
    return TIMETABLE_ENTRIES.filter(e => e.venueId === venueId && e.status === 'ACTIVE').length;
  }

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Venues' }]}>
      {isOffline && (
        <div className="bg-amber-50 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-amber-200 mb-5 shadow-sm">
          <WifiOff size={15} className="text-amber-600 flex-shrink-0" />
          <span>Working in offline view. Venue mutations will be cached locally.</span>
        </div>
      )}

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Venue Management</h1>
          <p className="text-slate-500 text-sm">
            {venues.filter(v => v.active).length} active venues · {venues.length} total across campus
          </p>
        </div>
        <Button className="sm:ml-auto" onClick={() => handleOpenModal()}>
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
          <p className="text-xs text-slate-500 mt-1">Under Maintenance</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900">{venues.reduce((s, v) => s + v.capacity, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Campus Capacity</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search venues by code, name, building..."
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
                  {v.active ? 'Active' : 'Maintenance'}
                </Badge>
              </div>

              <p className="text-sm text-slate-700 mb-1">{v.name}</p>
              <p className="text-xs text-slate-500 mb-3">{v.floor}</p>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Capacity: <strong className="text-slate-900">{v.capacity} seats</strong></span>
                <span>Classes: <strong className="text-slate-900">{usage}</strong>/week</span>
              </div>

              {/* Utilization bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Capacity Utilization</span>
                  <span>{Math.min(utilization, 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenModal(v)}>
                  Edit
                </Button>
                <Button variant={v.active ? 'secondary' : 'ghost'} size="sm" onClick={() => toggleActive(v)}>
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
        title={selectedVenue ? 'Edit Venue' : 'Add New Venue'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveVenue} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Venue'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Venue Code</label>
              <input
                type="text"
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                placeholder="e.g. LH 26"
                disabled={!!selectedVenue}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Venue Name</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Lecture Hall 26"
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Building</label>
              <input
                type="text"
                value={formBuilding}
                onChange={e => setFormBuilding(e.target.value)}
                placeholder="e.g. Science & Computing Complex"
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Floor (Number)</label>
              <input
                type="number"
                value={formFloor}
                onChange={e => setFormFloor(e.target.value)}
                min={0}
                max={20}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Seating Capacity</label>
            <input
              type="number"
              value={formCapacity}
              onChange={e => setFormCapacity(e.target.value)}
              min={1}
              className="w-full text-sm rounded-lg border border-slate-300 p-2"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
