import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { jobApi } from '../../services/apiService';
import { PageLoading } from '../common/PageLoading';
import { JobDetailPage } from './JobDetailPage';

function parseList(value) {
  return Array.isArray(value) ? value : (value || '').split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
}

function parseParagraphs(value) {
  return Array.isArray(value) ? value : (value || '').split('\n').map(item => item.trim()).filter(Boolean);
}

export function JobDetailRoute() {
  const { selectedJobId, selectedJobOverride, setSelectedJobOverride, jobs, setActivePage } = useApp();
  const hasJob = String(selectedJobOverride?.id) === String(selectedJobId)
    || jobs.some(job => String(job.id) === String(selectedJobId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasJob) return;
    let active = true;
    jobApi.getJobById(selectedJobId).then(response => {
      if (!active) return;
      const job = response?.data || response;
      if (!job?.id) throw new Error('Không tìm thấy thông tin công việc.');
      setSelectedJobOverride({ ...job, company: job.companyName || job.company,
        requiredSkills: parseList(job.requiredSkills), preferredSkills: parseList(job.preferredSkills),
        responsibilities: parseParagraphs(job.responsibilities), requirements: parseParagraphs(job.requirements),
      });
    }).catch(requestError => {
      if (active) setError(requestError?.message || 'Không thể tải thông tin việc làm. Vui lòng thử lại.');
    });
    return () => { active = false; };
  }, [selectedJobId, hasJob, setSelectedJobOverride]);

  if (hasJob) return <JobDetailPage />;
  if (!error) return <PageLoading label="Đang tải thông tin việc làm..." />;
  return <div className="px-6 py-12 text-center"><p role="alert" className="mb-4 text-slate-600">{error}</p><button className="btn btn-primary" onClick={() => setActivePage('job-search')}>Quay lại danh sách việc làm</button></div>;
}
