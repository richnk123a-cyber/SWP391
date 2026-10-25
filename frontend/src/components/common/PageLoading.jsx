import { Loader2 } from 'lucide-react';

export function PageLoading({ label = 'Đang tải trang...' }) {
  return <div className="flex min-h-64 items-center justify-center gap-3 px-6 py-12 text-sm text-slate-500" role="status"><Loader2 size={20} className="animate-spin" aria-hidden="true" />{label}</div>;
}
