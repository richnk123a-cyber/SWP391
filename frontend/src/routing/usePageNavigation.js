import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardForRole, normalizePage, pathForPage, routeFromLocation, ROUTES } from './routes';

export function usePageNavigation(currentUser) {
  const [initialRoute] = useState(() => routeFromLocation(window.location.pathname, window.location.search));
  const [activePage, updateActivePage] = useState(() => initialRoute.page === 'home' && currentUser
    ? dashboardForRole(currentUser.role) : initialRoute.page);
  const [selectedJobId, updateSelectedJobId] = useState(initialRoute.jobId || 'job-1');
  const pageRef = useRef(activePage);
  const jobIdRef = useRef(selectedJobId);

  const setSelectedJobId = useCallback((value) => {
    const next = typeof value === 'function' ? value(jobIdRef.current) : value;
    jobIdRef.current = next;
    updateSelectedJobId(next);
  }, []);

  const setActivePage = useCallback((value, { replace = false, query } = {}) => {
    const next = normalizePage(typeof value === 'function' ? value(pageRef.current) : value);
    const nextPath = pathForPage(next, jobIdRef.current);
    // Preserve an existing page's query when only its state is refreshed.
    const samePage = next === pageRef.current && window.location.pathname === nextPath;
    const params = new URLSearchParams(samePage ? window.location.search : '');
    if (query) Object.entries(query).forEach(([name, value]) => {
      if (value == null || value === '') params.delete(name);
      else params.set(name, String(value));
    });
    const target = nextPath + (params.size ? `?${params}` : '') + (samePage ? window.location.hash : '');
    const previous = window.location.pathname + window.location.search + window.location.hash;
    if (target !== previous) {
      window.history[replace ? 'replaceState' : 'pushState']({ careerfitPage: next }, '', target);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    pageRef.current = next;
    updateActivePage(next);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = routeFromLocation(window.location.pathname, window.location.search);
      if (route.jobId) setSelectedJobId(route.jobId);
      pageRef.current = route.page;
      updateActivePage(route.page);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setSelectedJobId]);

  useEffect(() => {
    document.title = `${ROUTES[activePage].title} | CareerFit`;
    // OAuth tokens stay available until the authentication bootstrap consumes them.
    const params = new URLSearchParams(window.location.search);
    if (params.has('token') || params.has('registerToken') || activePage === 'oauth-callback' || activePage === 'not-found') return;
    const path = pathForPage(activePage, jobIdRef.current);
    if (window.location.pathname !== path) {
      window.history.replaceState({ careerfitPage: activePage }, '', path + window.location.search + window.location.hash);
    }
  }, [activePage]);

  return { activePage, setActivePage, selectedJobId, setSelectedJobId };
}
