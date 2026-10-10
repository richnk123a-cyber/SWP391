import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/Badge';
import { Building2, Globe, Mail, Phone, MapPin, ShieldCheck, Edit3, Save, CheckCircle2, FileText, User } from 'lucide-react';

export function CompanyProfilePage() {
  const { employerProfile, setCompanies, showToast, setActivePage } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: employerProfile.companyName || 'FPT Software',
    recruiterName: employerProfile.recruiterName || 'Trần Thị B',
    email: employerProfile.email || 'employer@gmail.com',
    phone: employerProfile.phone || '028 3730 8888',
    website: employerProfile.website || 'https://fpt-software.com',
    industry: employerProfile.industry || 'Phần mềm & IT Outsourcing',
    size: employerProfile.size || '1000+ nhân viên',
    location: employerProfile.location || 'Quận 9, TP.HCM',
    taxId: employerProfile.taxId || 'Chưa cập nhật',
    description: employerProfile.description || 'FPT Software là công ty xuất khẩu dịch vụ phần mềm hàng đầu Việt Nam với hơn 30.000 kỹ sư công nghệ tại 30 quốc gia trên thế giới.'
  });

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    setCompanies(prev =>
      prev.map(c => (c.id === employerProfile.id || c.companyName === employerProfile.companyName ? { ...c, ...formData } : c))
    );
    setIsEditing(false);
    showToast('Đã cập nhật thông tin Hồ sơ Doanh nghiệp thành công!', 'success');
  };

  return (
    <div className="employer-workspace employer-companyprofilepage space-y-6 mx-auto">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-2xl flex items-center justify-center shrink-0">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{employerProfile.companyName}</h1>
              <VerificationBadge status={employerProfile.verificationStatus} />
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Mã số thuế: <strong className="font-mono text-white">{employerProfile.taxId || 'Chưa cập nhật'}</strong> • Lĩnh vực: {employerProfile.industry}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Edit3 size={15} /> Chỉnh sửa hồ sơ
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary text-xs font-bold text-white bg-white/10 hover:bg-white/20 border-white/20"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* EDIT FORM / VIEW DETAILS */}
      {isEditing ? (
        <form onSubmit={handleSaveSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Edit3 size={16} className="text-blue-600" /> Cập nhật thông tin Doanh nghiệp
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Tên Doanh nghiệp *</label>
              <input
                type="text"
                required
                className="form-control text-xs"
                value={formData.companyName}
                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Người đại diện HR / Tuyển dụng *</label>
              <input
                type="text"
                required
                className="form-control text-xs"
                value={formData.recruiterName}
                onChange={e => setFormData(prev => ({ ...prev, recruiterName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Email công việc *</label>
              <input
                type="email"
                required
                className="form-control text-xs"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Số điện thoại liên hệ</label>
              <input
                type="text"
                className="form-control text-xs"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Mã số thuế (Tax ID)</label>
              <input
                type="text"
                className="form-control text-xs font-mono"
                value={formData.taxId}
                onChange={e => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Website Doanh nghiệp</label>
              <input
                type="url"
                className="form-control text-xs"
                value={formData.website}
                onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Lĩnh vực hoạt động</label>
              <input
                type="text"
                className="form-control text-xs"
                value={formData.industry}
                onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-900">Quy mô nhân sự</label>
              <input
                type="text"
                className="form-control text-xs"
                value={formData.size}
                onChange={e => setFormData(prev => ({ ...prev, size: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-slate-900">Địa chỉ văn phòng trụ sở *</label>
            <input
              type="text"
              required
              className="form-control text-xs"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-slate-900">Mô tả tổng quan Doanh nghiệp</label>
            <textarea
              rows={4}
              className="form-control text-xs leading-relaxed"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary text-xs">Hủy</button>
            <button type="submit" className="btn btn-primary text-xs font-bold">
              <Save size={15} /> Lưu thay đổi
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Mô tả doanh nghiệp</h3>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {formData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Website</span>
                <a href={formData.website} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  <Globe size={13} /> {formData.website}
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mã số thuế</span>
                <span className="font-mono font-bold text-slate-800">{formData.taxId}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trụ sở văn phòng</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" /> {formData.location}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quy mô nhân sự</span>
                <span className="font-medium text-slate-700">{formData.size}</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Contact & Verification */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <User size={15} className="text-blue-600" /> Đại diện Tuyển dụng (HR)
              </h4>

              <div className="space-y-2 text-slate-700">
                <p>Họ tên HR: <strong>{formData.recruiterName}</strong></p>
                <p>Email: <strong>{formData.email}</strong></p>
                <p>Điện thoại: <strong>{formData.phone}</strong></p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-blue-600" /> Xác minh Doanh nghiệp
                </h4>
                <VerificationBadge status={employerProfile.verificationStatus} />
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                {employerProfile.verificationStatus === 'Verified'
                  ? 'Tài khoản đã được Admin kiểm duyệt Giấy phép kinh doanh hợp lệ.'
                  : 'Tài khoản đang chờ Ban Quản trị xác minh Giấy phép kinh doanh.'}
              </p>

              <button
                onClick={() => setActivePage('employer-register')}
                className="btn btn-secondary w-full text-xs font-semibold bg-white"
              >
                Trang quản lý Xác minh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


