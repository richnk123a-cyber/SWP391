import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AlertTriangle, Send } from 'lucide-react';

export function ReportJobModal() {
  const { isReportModalOpen, setIsReportModalOpen, selectedJob, reportJob } = useApp();

  const [reason, setReason] = useState('Có dấu hiệu lừa đảo, yêu cầu nộp cọc/học phí');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const normalizedDescription = description.trim();
    if (reason === 'Lý do khác' && !normalizedDescription) {
      setError('Vui lòng nhập mô tả chi tiết khi chọn Lý do khác.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await reportJob(selectedJob.id, reason, normalizedDescription || null);
      setIsReportModalOpen(false);
      setDescription('');
      setReason('Có dấu hiệu lừa đảo, yêu cầu nộp cọc/học phí');
    } catch (requestError) {
      setError(requestError?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReportModalOpen) return null;

  return (
    <Modal
      isOpen={isReportModalOpen}
      onClose={() => !submitting && setIsReportModalOpen(false)}
      title="Báo cáo tin tuyển dụng vi phạm / giả mạo"
    >
      <form onSubmit={handleSubmitReport} className="space-y-4">
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <span>
            Báo cáo của bạn sẽ được gửi ẩn danh tới Ban quản trị CareerFit để thẩm định và gỡ bỏ kịp thời nếu phát hiện dấu hiệu lừa đảo sinh viên.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Tin tuyển dụng:</label>
          <input
            type="text"
            className="form-control text-xs bg-slate-50 font-semibold"
            value={selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : ''}
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lý do báo cáo vi phạm <span className="text-rose-500">*</span></label>
          <select
            className="form-control text-xs"
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            <option value="Thông tin công việc không chính xác">Thông tin công việc không chính xác</option>
            <option value="Có dấu hiệu lừa đảo, yêu cầu nộp cọc/học phí">Có dấu hiệu lừa đảo, yêu cầu nộp cọc/học phí</option>
            <option value="Yêu cầu thanh toán tiền mua thiết bị/đồng phục">Yêu cầu thanh toán tiền mua thiết bị/đồng phục</option>
            <option value="Nội dung không phù hợp hoặc phân biệt đối xử">Nội dung không phù hợp hoặc phân biệt đối xử</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Mô tả chi tiết {reason === 'Lý do khác' ? '*' : '(tùy chọn)'}
          </label>
          <textarea
            className="form-control text-xs h-24"
            placeholder="Mô tả nội dung tin nhắn, số tài khoản yêu cầu chuyển tiền hoặc link bằng chứng..."
            value={description}
            maxLength={2000}
            required={reason === 'Lý do khác'}
            onChange={e => { setDescription(e.target.value); setError(''); }}
          ></textarea>
          <p className="text-right text-[11px] text-slate-400 mt-1">{description.length}/2000</p>
        </div>

        {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(false)}
            disabled={submitting}
            className="btn btn-secondary text-xs"
          >
            Hủy bỏ
          </button>
          <button type="submit" disabled={submitting} className="btn btn-danger text-xs disabled:opacity-60">
            <Send size={14} /> {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
