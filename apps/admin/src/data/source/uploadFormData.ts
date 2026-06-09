import { API_BASE_URL } from '../../shared/config/env';

/** multipart через fetch — надёжнее axios на мобильном Safari */
export async function postFormData<T>(path: string, fieldName: string, file: File): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file, file.name);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.text();
    const err = new Error(data || res.statusText) as Error & { response?: { data: string; status: number } };
    err.response = { data, status: res.status };
    throw err;
  }

  return res.json() as Promise<T>;
}
