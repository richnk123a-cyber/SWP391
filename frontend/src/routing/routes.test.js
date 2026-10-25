import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, canAccessPage, dashboardForRole, normalizePage, pathForPage, routeFromLocation } from './routes.js';

test('every page has a unique URL and resolves on a direct visit', () => {
  const paths = Object.values(ROUTES).map(route => route.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const page of Object.keys(ROUTES)) {
    assert.equal(routeFromLocation(pathForPage(page, '42')).page, page);
  }
});

test('login, registration and OAuth callbacks have distinct routes', () => {
  assert.equal(routeFromLocation('/login/').page, 'login');
  assert.equal(routeFromLocation('/oauth-success', '?token=example').page, 'oauth-callback');
  assert.equal(routeFromLocation('/oauth-register', '?registerToken=example').page, 'register-entry');
  assert.equal(pathForPage('oauth-register'), '/register');
  assert.equal(normalizePage('user-management'), 'admin-user-management');
});

test('job URLs preserve IDs independently of in-memory page selection', () => {
  for (const id of ['42', 'job-1', 'id with spaces', 'a/b']) {
    assert.deepEqual(routeFromLocation(pathForPage('job-detail', id)), { page: 'job-detail', jobId: id });
  }
  assert.equal(routeFromLocation('/jobs/%broken').page, 'not-found');
  assert.equal(routeFromLocation('/missing').page, 'not-found');
});

test('protected pages remain separated by role', () => {
  for (const role of ['CANDIDATE', 'EMPLOYER', 'ADMIN']) {
    assert.equal(canAccessPage(dashboardForRole(role), role), true);
    for (const other of ['CANDIDATE', 'EMPLOYER', 'ADMIN'].filter(item => item !== role)) {
      assert.equal(canAccessPage(dashboardForRole(role), other), false);
    }
  }
  assert.equal(canAccessPage('candidate-profile'), false);
  assert.equal(canAccessPage('login'), true);
  assert.equal(canAccessPage('job-detail'), true);
  assert.equal(canAccessPage('candidate-onboarding'), true);
  assert.equal(canAccessPage('candidate-onboarding', 'EMPLOYER'), false);
  assert.equal(canAccessPage('employer-register', 'CANDIDATE'), false);
});

test('account settings keep the existing security links and role permissions', () => {
  for (const [prefix, role] of [['candidate', 'CANDIDATE'], ['employer', 'EMPLOYER'], ['admin', 'ADMIN']]) {
    const page = prefix + '-security';
    assert.equal(routeFromLocation('/' + prefix + '/settings').page, page);
    assert.equal(routeFromLocation('/' + prefix + '/security').page, page);
    assert.equal(pathForPage(page), '/' + prefix + '/settings');
    assert.equal(canAccessPage(page, role), true);
    assert.equal(canAccessPage(page), false);
  }
});
