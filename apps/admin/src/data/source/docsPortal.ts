import axiosInstance from './axiosInstance';

export interface DocsPortalStats {
  visitors_total: number;
  visitors_with_password: number;
  active_today: number;
}

export interface DocsPortalVisitor {
  id: number;
  display_name: string;
  created_at: string;
  last_seen_at: string | null;
  has_password: boolean;
}

export const fetchDocsPortalStats = () =>
  axiosInstance.get<DocsPortalStats>('/api/admin/docs/stats').then((r) => r.data);

export const fetchDocsPortalVisitors = () =>
  axiosInstance
    .get<{ visitors: DocsPortalVisitor[] }>('/api/admin/docs/visitors')
    .then((r) => r.data.visitors ?? []);
