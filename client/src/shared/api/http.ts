export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  const text = await res.text();

  if (!res.ok) throw new ApiError(res.status, text || res.statusText);
  return (text ? JSON.parse(text) : undefined) as T;
}
