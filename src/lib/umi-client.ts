// UMI PAY — عميل الاستدعاءات
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const j = await res.json();
  if (!res.ok || !j.ok) throw new Error(j.error ?? "خطأ غير متوقع");
  return j.data as T;
}
