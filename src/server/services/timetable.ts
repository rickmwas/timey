import { isTimeRangeOverlapping, detectSlotConflicts, type SlotConflict, type SlotLike } from "@/server/services/conflicts";

export type VenueSummary = {
  id: string;
  code: string;
  name: string;
  building: string;
  capacity: number;
  isActive: boolean;
  isUnderMaintenance?: boolean;
};

export type VenueAvailabilityQuery = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  minCapacity?: number;
  building?: string;
};

export type AvailabilityResult = {
  availableVenues: Array<{
    id: string;
    code: string;
    name: string;
    building: string;
    capacity: number;
    status: "AVAILABLE";
  }>;
  occupiedVenues: Array<{
    id: string;
    code: string;
    name: string;
    building: string;
    capacity: number;
    occupiedBy: string;
    occupiedUntil: string;
    status: "OCCUPIED";
  }>;
};

export function findAvailableVenues(
  query: VenueAvailabilityQuery,
  venues: VenueSummary[],
  slots: SlotLike[],
): AvailabilityResult {
  const minCapacity = query.minCapacity ?? 0;
  const buildingFilter = query.building?.trim();

  const filteredVenues = venues.filter(
    (venue) =>
      venue.isActive &&
      !venue.isUnderMaintenance &&
      venue.capacity >= minCapacity &&
      (!buildingFilter || venue.building === buildingFilter),
  );

  const occupiedByVenue = new Map<string, SlotLike>();

  for (const slot of slots) {
    if (slot.day !== query.dayOfWeek) continue;
    if (!isTimeRangeOverlapping(slot.startTime, slot.endTime, query.startTime, query.endTime)) continue;
    occupiedByVenue.set(slot.venueId, slot);
  }

  const availableVenues = filteredVenues
    .filter((venue) => !occupiedByVenue.has(venue.id))
    .map((venue) => ({
      id: venue.id,
      code: venue.code,
      name: venue.name,
      building: venue.building,
      capacity: venue.capacity,
      status: "AVAILABLE" as const,
    }));

  const occupiedVenues = filteredVenues
    .filter((venue) => occupiedByVenue.has(venue.id))
    .map((venue) => {
      const occupancy = occupiedByVenue.get(venue.id)!;
      return {
        id: venue.id,
        code: venue.code,
        name: venue.name,
        building: venue.building,
        capacity: venue.capacity,
        occupiedBy: occupancy.id,
        occupiedUntil: occupancy.endTime,
        status: "OCCUPIED" as const,
      };
    });

  return {
    availableVenues,
    occupiedVenues,
  };
}

export function validateSlotForConflicts(existingSlots: SlotLike[], candidate: SlotLike): SlotConflict[] {
  return detectSlotConflicts([...existingSlots, candidate]).filter(
    (conflict) => conflict.sourceId === candidate.id || conflict.targetId === candidate.id,
  );
}
