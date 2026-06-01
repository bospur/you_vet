import type { BookingRequest } from '../../api';
import type { BookingRequestStatus } from './labels';

const ACTIVE_STATUSES: BookingRequestStatus[] = ['pending', 'confirmed', 'rescheduled'];

export function isActiveBookingRequest(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as BookingRequestStatus);
}

export function partitionBookingRequests(requests: BookingRequest[]): {
  active: BookingRequest[];
  archive: BookingRequest[];
} {
  const active: BookingRequest[] = [];
  const archive: BookingRequest[] = [];
  for (const req of requests) {
    if (isActiveBookingRequest(req.status)) {
      active.push(req);
    } else {
      archive.push(req);
    }
  }
  const byDateAsc = (a: BookingRequest, b: BookingRequest) =>
    a.requested_date.localeCompare(b.requested_date) ||
    (a.slot_time ?? '').localeCompare(b.slot_time ?? '');
  const byDateDesc = (a: BookingRequest, b: BookingRequest) => -byDateAsc(a, b);

  active.sort(byDateAsc);
  archive.sort(byDateDesc);
  return { active, archive };
}
