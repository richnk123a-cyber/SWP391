import { useCallback, useEffect, useRef, useState } from 'react';
import { jobApi } from '../services/apiService';

const DEFAULT_PAGE_SIZE = 10;

function normalizeJob(job) {
  const requiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (job.requiredSkills || '')
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);

  return {
    ...job,
    company: job.companyName || 'Doanh nghiệp chưa cập nhật',
    requiredSkills,
    isVerified: ['Verified', 'VERIFIED'].includes(job.verificationStatus),
    verifiedStatus: job.verificationStatus,
    moderationStatus: 'APPROVED'
  };
}

export function useJobSearch({
  keyword,
  location,
  category,
  jobType,
  minSalary,
  maxSalary,
  sort = 'newest',
  page = 0,
  size = DEFAULT_PAGE_SIZE
}) {
  const [debouncedKeyword, setDebouncedKeyword] = useState(() => (keyword || '').trim());
  const [jobs, setJobs] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const requestSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword((keyword || '').trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++requestSequence.current;

    async function loadJobs() {
      setIsLoading(true);
      setError('');
      try {
        const response = await jobApi.searchJobs({
          keyword: debouncedKeyword || undefined,
          location: location || undefined,
          category: category || undefined,
          jobType: jobType || undefined,
          minSalary: minSalary ?? undefined,
          maxSalary: maxSalary ?? undefined,
          sort,
          page,
          size
        }, controller.signal);
        const pageData = response?.data;
        if (sequence !== requestSequence.current) return;

        setJobs((pageData?.content || []).map(normalizeJob));
        setTotalPages(pageData?.totalPages || 0);
        setTotalElements(pageData?.totalElements || 0);
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.code === 'ERR_CANCELED') return;
        if (sequence !== requestSequence.current) return;
        setJobs([]);
        setTotalPages(0);
        setTotalElements(0);
        setError(requestError?.message || 'Không thể tải danh sách việc làm. Vui lòng thử lại.');
      } finally {
        if (!controller.signal.aborted && sequence === requestSequence.current) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();
    return () => controller.abort();
  }, [debouncedKeyword, location, category, jobType, minSalary, maxSalary, sort, page, size, reloadKey]);

  const retry = useCallback(() => setReloadKey(value => value + 1), []);

  return {
    jobs,
    isLoading,
    error,
    totalPages,
    totalElements,
    retry
  };
}
