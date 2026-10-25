export function resolveBackendUrl(env = {}) {
  return String(env.VITE_API_URL || env.VITE_BACKEND_URL || 'http://localhost:8080')
    .trim().replace(/\/+$/, '').replace(/\/api$/, '');
}

export const BACKEND_URL = resolveBackendUrl(import.meta.env || {});

export function connectionErrorMessage(error) {
  if (error?.code === 'ECONNABORTED' || error?.name === 'AbortError') {
    return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.';
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error'
      || error instanceof TypeError) {
    return 'Không thể kết nối máy chủ CareerFit. Hãy kiểm tra backend đang chạy rồi thử lại.';
  }
  return error?.message || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
}

export async function checkBackendReady(baseUrl = BACKEND_URL, fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetcher(`${baseUrl}/api/auth/me`, {
      signal: controller.signal, credentials: 'include', headers: { Accept: 'application/json' },
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return false;
    const data = await response.json();
    return typeof data.authenticated === 'boolean';
  } catch { return false; }
  finally { clearTimeout(timeout); }
}
