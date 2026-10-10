import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Calendar, Video, Send, Clock, MapPin, FileText, CheckCircle2 } from 'lucide-react';

export function ScheduleInterviewModal({ appId, onClose }) {
  const { applications, employerProfile, updateApplicationStatus, showToast } = useApp();

  const app = applications.find(a => a.id === appId);

  const companySlug = (employerProfile?.companyName || 'hr').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const [date, setDate] = useState('Thứ Năm, 15/10/2026');
  const [time, setTime] = useState('14:30 - 15:30 GMT+7');
  const [type, setType] = useState('Online (Google Meet)');
  const [meetingLink, setMeetingLink] = useState(`https://meet.google.com/${companySlug || 'hr'}-interview`);
  const [note, setNote] = useState('Vui lòng chuẩn bị bài giới thiệu bản thân 5 phút và sẵn sàng chia sẻ màn hình trao đổi về kinh nghiệm / đồ án.');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!appId) return;

    updateApplicationStatus(appId, 'Phỏng vấn', {
      date,
      time,
      type,
      meetingLink,
      note
    });

    showToast(`Đã lên lịch phỏng vấn thành công cho ứng viên ${app?.candidateName || ''}!`, 'success');
    onClose();
  };

  if (!app) return null;

  return (
    <Modal
      isOpen={!!appId}
      onClose={onClose}
      title={`Lên Lịch Phỏng vấn với Ứng viên - ${app.candidateName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 text-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900 text-sm">{app.candidateName}</p>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {app.candidateUniversity || app.candidateEmail}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Trạng thái ứng viên sẽ được chuyển sang <strong>"Phỏng vấn"</strong> và hệ thống tự động gửi thông báo lịch phỏng vấn tới Ứng viên.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label font-bold text-slate-900 flex items-center gap-1">
              <Calendar size={13} className="text-blue-600" /> Ngày phỏng vấn *
            </label>
            <input
              type="text"
              className="form-control text-xs h-10"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-slate-900 flex items-center gap-1">
              <Clock size={13} className="text-blue-600" /> Giờ phỏng vấn *
            </label>
            <input
              type="text"
              className="form-control text-xs h-10"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label font-bold text-slate-900">Hình thức phỏng vấn *</label>
          <select
            className="form-control text-xs h-10"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="Online (Google Meet)">Online (Google Meet / MS Teams)</option>
            <option value="On-site (Tại văn phòng)">On-site (Trực tiếp tại văn phòng)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label font-bold text-slate-900 flex items-center gap-1">
            <Video size={13} className="text-blue-600" /> Link cuộc họp online / Địa chỉ văn phòng *
          </label>
          <input
            type="text"
            className="form-control text-xs h-10 font-mono"
            value={meetingLink}
            onChange={e => setMeetingLink(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label font-bold text-slate-900 flex items-center gap-1">
            <FileText size={13} className="text-blue-600" /> Ghi chú & Dặn dò ứng viên
          </label>
          <textarea
            className="form-control text-xs h-20 leading-relaxed"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Dặn dò về trang phục, chuẩn bị đồ án hoặc file demo..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-secondary text-xs">Hủy bỏ</button>
          <button type="submit" className="btn btn-primary text-xs font-bold px-4">
            <Send size={14} /> Xác nhận & Gửi lịch phỏng vấn
          </button>
        </div>
      </form>
    </Modal>
  );
}
