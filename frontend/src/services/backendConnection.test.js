import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBackendUrl, checkBackendReady, connectionErrorMessage } from './backendConnection.js';

test('login and jobs resolve the same configured backend without duplicate /api', () => {
  assert.equal(resolveBackendUrl(), 'http://localhost:8080');
  assert.equal(resolveBackendUrl({ VITE_API_URL: 'http://localhost:8080/api/' }), 'http://localhost:8080');
  assert.equal(resolveBackendUrl({ VITE_BACKEND_URL: 'http://localhost:9090/' }), 'http://localhost:9090');
});
test('login readiness requires a successful auth JSON response, not HTML or 401', async () => {
  const json = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  assert.equal(await checkBackendReady('http://backend', async url => {
    assert.equal(url, 'http://backend/api/auth/me'); return json({ authenticated: false });
  }), true);
  assert.equal(await checkBackendReady('http://backend', async () => new Response('', { status: 401 })), false);
  assert.equal(await checkBackendReady('http://backend', async () => new Response('<html>Login</html>')), false);
  assert.equal(await checkBackendReady('http://backend', async () => json({ unrelated: true })), false);
  assert.equal(await checkBackendReady('http://backend', async () => { throw new TypeError('Failed to fetch'); }), false);
});
test('connection failures do not masquerade as invalid passwords', () => {
  assert.match(connectionErrorMessage({ code: 'ERR_NETWORK' }), /backend/);
  assert.match(connectionErrorMessage(new TypeError('Failed to fetch')), /backend/);
  assert.equal(connectionErrorMessage(new Error('Mật khẩu không đúng')), 'Mật khẩu không đúng');
});
