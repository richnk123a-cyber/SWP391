import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AlertTriangle, Send } from 'lucide-react';

export function ReportJobModal() {
  const { isReportModalOpen, setIsReportModalOpen, selectedJob, reportJob } = useApp();

  const [reason, setReason] = useState('Có dấu hiệu lừa đảo, yêu cầu nộp cọc / học phí');
  const [description, setDescription] = useState('');

  const handleSubmitReport = (e) => {
    e.preventDefault();
    reportJob(selectedJob.id, reason, description);
    setIsReportModalOpen(false);
    setDescription('');
  };

  if (!isReportModalOpen) return null;

  return (
    <Modal
      isOpen={isReportModalOpen}
      onClose={() => setIsReportModalOpen(false)}
      title="Báo cáo tin tuyển dụng đáng ngờ"
    >
      <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
        <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800 flex items-start gap-2">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p>
            Bạn đang báo cáo tin tuyển dụng: <strong>{selectedJob.title}</strong> - {selectedJob.company}. Báo cáo của bạn sẽ được gửi tới Ban Quản trị xử lý.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Lý do báo cáo vi phạm *</label>
          <select
            className="form-control text-xs"
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            <option value="Thông tin công việc không chính xác">Thông tin công việc không chính xác</option>
            <option value="Có dấu hiệu lừa đảo, yêu cầu nộp cọc / học phí">Có dấu hiệu lừa đảo, yêu cầu nộp cọc / học phí</option>
            <option value="Yêu cầu thanh toán tiền mua thiết bị / đồng phục">Yêu cầu thanh toán tiền mua thiết bị / đồng phục</option>
            <option value="Nội dung không phù hợp hoặc phân biệt đối xử">Nội dung không phù hợp hoặc phân biệt đối xử</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Mô tả chi tiết bằng chứng (tùy chọn)</label>
          <textarea
            className="form-control text-xs h-24"
            placeholder="Mô tả nội dung tin nhắn, số tài khoản yêu cầu chuyển tiền hoặc link bằng chứng..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(false)}
            className="btn btn-secondary text-xs"
          >
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-danger text-xs">
            <Send size={14} /> Gửi báo cáo
          </button>
        </div>
      </form>
    </Modal>
  );
}
