import axiosInstance from './axiosInstance';

export interface DocsPortalStats {
  visitors_total: number;
  visitors_with_password: number;
  active_today: number;
  visits_today: number;
  visits_last_7_days: number;
  visits_last_30_days: number;
}

export interface DocsPortalVisitor {
  id: number;
  display_name: string;
  created_at: string;
  last_seen_at: string | null;
  last_path: string;
  visit_count: number;
  has_password: boolean;
}

export interface DocsPortalVisit {
  id: number;
  path: string;
  created_at: string;
}

export const fetchDocsPortalStats = () =>
  axiosInstance.get<DocsPortalStats>('/api/admin/docs/stats').then((r) => r.data);

export const fetchDocsPortalVisitors = () =>
  axiosInstance
    .get<{ visitors: DocsPortalVisitor[] }>('/api/admin/docs/visitors')
    .then((r) => r.data.visitors ?? []);

export const fetchDocsPortalVisits = (id: number) =>
  axiosInstance
    .get<{ visits: DocsPortalVisit[] }>(`/api/admin/docs/visitors/${id}/visits?limit=80`)
    .then((r) => r.data.visits ?? []);
