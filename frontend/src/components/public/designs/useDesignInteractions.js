import { useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';

// Keep preview interactions inside the mounted component and clean up on exit.
export function useDesignInteractions(variant) {
  const rootRef = useRef(null);
  const { setActivePage, setGlobalSearchQuery, showToast } = useApp();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const originalOverflow = document.body.style.overflow;
    const drawer = root.querySelector('#filter-drawer');
    const overlay = root.querySelector('#filter-overlay');
    const openButton = root.querySelector('#open-filter');
    const setDrawer = (open) => {
      drawer?.classList.toggle('is-open', open);
      overlay?.classList.toggle('is-open', open);
      overlay?.setAttribute('aria-hidden', String(!open));
      openButton?.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : originalOverflow;
      (open ? root.querySelector('#close-filter') : openButton)?.focus();
    };
    const navigate = (page, options) => {
      setActivePage(page, options);
    };
    const search = () => {
      const input = root.querySelector('#search-keyword, .search-box__input, .search-bar__input');
      setGlobalSearchQuery(input?.value || '');
      navigate('job-search', { query: { keyword: (input?.value || '').trim() } });
    };
    const click = (event) => {
      const target = event.target.closest('a, button, #filter-overlay');
      if (!target || !root.contains(target)) return;
      if (target.id === 'open-filter') return setDrawer(true);
      if (['close-filter', 'apply-filter-drawer', 'filter-overlay'].includes(target.id)) return setDrawer(false);
      if (target.matches('.category-tab')) {
        root.querySelectorAll('.category-tab').forEach(tab => tab.classList.toggle('is-active', tab === target));
        root.querySelectorAll('.job-row').forEach(row => {
          row.hidden = target.dataset.cat !== 'all' && row.dataset.category !== target.dataset.cat;
        });
        return;
      }
      if (target.matches('.filter-skill-tags .tag')) {
        const active = target.getAttribute('aria-pressed') !== 'true';
        target.setAttribute('aria-pressed', String(active));
        target.classList.toggle('tag--active', active);
        return;
      }
      if (target.id === 'clear-filters') {
        root.querySelectorAll('.filter-sidebar input').forEach(input => { input.checked = false; });
        root.querySelectorAll('.filter-sidebar select').forEach(select => { select.selectedIndex = 0; });
        root.querySelectorAll('.filter-skill-tags .tag').forEach(tag => {
          tag.classList.remove('tag--active');
          tag.setAttribute('aria-pressed', 'false');
        });
        return;
      }
      if (target.matches('.search-box__button, .search-box__btn, .search-bar__btn')) return search();
      if (target.matches('.btn-bookmark')) {
        showToast('Đăng nhập và mở trang Việc làm IT để lưu công việc.', 'info');
        return;
      }
      if (target.tagName !== 'A') return;
      const href = target.getAttribute('href');
      if (href?.startsWith('#') && href !== '#') return;
      const routes = {
        '/': 'home', '/jobs': 'job-search', '/login': 'login',
        '/register': 'register-entry', '/profile': 'candidate-onboarding',
        '/report': 'candidate-onboarding', '/learning': 'login',
        '/students': 'candidate-onboarding', '/freshers': 'candidate-onboarding',
        '/employers': 'employer-register',
      };
      event.preventDefault();
      const text = target.textContent.trim().toLowerCase();
      let page = routes[href];
      if (!page && /đăng nhập/.test(text)) page = 'login';
      if (!page && /đăng ký|tạo hồ sơ/.test(text)) page = 'register-entry';
      if (!page && /tải cv|hồ sơ/.test(text)) page = 'candidate-onboarding';
      if (!page && /nhà tuyển dụng|doanh nghiệp/.test(text)) page = 'employer-register';
      if (!page && /việc|chi tiết|vị trí/.test(text)) page = 'job-search';
      if (!page && /lộ trình/.test(text)) page = 'login';
      if (page) navigate(page);
      else showToast('Mục này chưa có nội dung trong bản thiết kế.', 'info');
    };
    const keydown = (event) => {
      if (event.key === 'Escape' && drawer?.classList.contains('is-open')) setDrawer(false);
      if (event.key === 'Enter' && event.target.matches('input[type="search"], .search-box__input')) {
        event.preventDefault();
        search();
      }
    };
    root.addEventListener('click', click);
    root.addEventListener('keydown', keydown);
    let observer;
    if (variant === 'landing' && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) root.querySelectorAll('.site-header__nav a').forEach(link => {
            link.style.color = link.getAttribute('href') === `#${entry.target.id}` ? 'var(--color-text)' : '';
          });
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      root.querySelectorAll('section[id]').forEach(section => observer.observe(section));
    }
    return () => {
      root.removeEventListener('click', click);
      root.removeEventListener('keydown', keydown);
      observer?.disconnect();
      document.body.style.overflow = originalOverflow;
    };
  }, [variant, setActivePage, setGlobalSearchQuery, showToast]);

  return rootRef;
}
