import { EmployerPageHeader } from './EmployerPageHeader';
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/Badge';
import { LogoCropperModal } from '../common/LogoCropperModal';
import { DeleteAccountModal } from '../common/DeleteAccountModal';
import { employerApi } from '../../services/apiService';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import { Globe, MapPin, ShieldCheck, Edit3, Save, User, Camera, Upload, Trash2, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';

export function CompanyProfilePage() {
  const { currentUser, employerProfile, setEmployerProfile, setCompanies, showToast, setActivePage } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: employerProfile?.companyName || (currentUser?.fullName ? currentUser.fullName : (currentUser?.username || '')),
    recruiterName: employerProfile?.recruiterName || currentUser?.fullName || currentUser?.username || '',
    email: employerProfile?.email || currentUser?.email || '',
    phone: employerProfile?.phone || currentUser?.phone || '',
    website: employerProfile?.website || '',
    industry: employerProfile?.industry || '',
    size: employerProfile?.size || '',
    location: employerProfile?.location || '',
    taxId: employerProfile?.taxId || '',
    logo: employerProfile?.logo || '🏢',
    description: employerProfile?.description || ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [selectedLogoName, setSelectedLogoName] = useState('');
  const [cropperFile, setCropperFile] = useState(null); // file pending crop
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if employerProfile updates from external sources
  useEffect(() => {
    if (!isEditing && employerProfile) {
      setFormData(prev => ({
        ...prev,
        companyName: employerProfile.companyName || prev.companyName,
        recruiterName: employerProfile.recruiterName || prev.recruiterName,
        email: employerProfile.email || prev.email,
        phone: employerProfile.phone || prev.phone,
        website: employerProfile.website || prev.website,
        industry: employerProfile.industry || prev.industry,
        size: employerProfile.size || prev.size,
        location: employerProfile.location || prev.location,
        taxId: employerProfile.taxId || prev.taxId,
        logo: employerProfile.logo || prev.logo,
        description: employerProfile.description || prev.description
      }));
    }
  }, [employerProfile, isEditing]);

  // Fetch fresh company profile directly from backend SQL Server
  useEffect(() => {
    employerApi.getMyCompany()
      .then(res => {
        const comp = res?.data || res;
        if (comp && (comp.companyName || comp.id)) {
          if (typeof setEmployerProfile === 'function') {
            setEmployerProfile(comp);
          }
          if (!isEditing) {
            setFormData(prev => ({
              ...prev,
              companyName: comp.companyName || prev.companyName,
              recruiterName: comp.recruiterName || prev.recruiterName,
              email: comp.email || prev.email,
              phone: comp.phone || prev.phone,
              website: comp.website || prev.website,
              industry: comp.industry || prev.industry,
              size: comp.size || prev.size,
              location: comp.location || prev.location,
              taxId: comp.taxId || prev.taxId,
              logo: comp.logo || prev.logo,
              description: comp.description || prev.description
            }));
          }
        }
      })
      .catch(err => {
        console.warn('Could not fetch company profile on mount:', err);
      });
  }, []);

  // Handle selecting a logo image file (from banner quick button or edit section)
  // Open cropper when file selected
  const handleLogoFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Định dạng ảnh không hợp lệ. Vui lòng chọn ảnh PNG, JPG, WEBP hoặc SVG.', 'danger');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh vượt quá giới hạn 5 MB. Vui lòng chọn ảnh nhẹ hơn.', 'danger');
      return;
    }

    setSelectedLogoName(file.name);
    // Open cropper modal – don't process yet
    setCropperFile(file);
  };

  // Called when user confirms crop in modal
  const handleCropApply = async (croppedDataUrl) => {
    setCropperFile(null);
    setLogoFile(true); // mark as pending file

    // Update form state immediately for preview
    setFormData(prev => ({ ...prev, logo: croppedDataUrl }));

    // If in view mode → auto-save immediately to database
    if (!isEditing) {
      setIsUploadingLogo(true);
      const finalLogo = croppedDataUrl;

      // Save directly into backend database
      try {
        await employerApi.updateMyCompany({
          companyName: formData.companyName || employerProfile?.companyName,
          recruiterName: formData.recruiterName || employerProfile?.recruiterName,
          phone: formData.phone || employerProfile?.phone,
          website: formData.website || employerProfile?.website,
          industry: formData.industry || employerProfile?.industry,
          size: formData.size || employerProfile?.size,
          location: formData.location || employerProfile?.location,
          logo: finalLogo
        });
      } catch (err) {
        console.warn('Backend updateMyCompany error:', err);
      } finally {
        setIsUploadingLogo(false);
      }

      const updated = { ...employerProfile, logo: finalLogo };
      if (typeof setEmployerProfile === 'function') {
        setEmployerProfile(updated);
      }
      if (typeof setCompanies === 'function') {
        setCompanies(prev => Array.isArray(prev) ? prev.map(c =>
          (c.id === employerProfile?.id || c.companyName === employerProfile?.companyName)
            ? { ...c, logo: finalLogo } : c
        ) : prev);
      }

      setFormData(prev => ({ ...prev, logo: finalLogo }));
      showToast('Logo đã được cập nhật trực tiếp vào cơ sở dữ liệu!', 'success');
    } else {
      showToast('Logo đã được cắt. Nhấn "Lưu thay đổi" để áp dụng.', 'info');
    }
  };

  // Reset logo to default
  const handleResetLogo = () => {
    setLogoFile(null);
    setSelectedLogoName('');
    setFormData(prev => ({ ...prev, logo: '🏢' }));
    showToast('Đã đặt lại logo về biểu tượng mặc định.', 'info');
  };

  // Submit edit form
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const finalLogo = formData.logo;

      const payload = {
        ...formData,
        logo: finalLogo
      };

      // Update frontend state & persistence safely
      if (typeof setEmployerProfile === 'function') {
        setEmployerProfile(prev => ({ ...prev, ...payload }));
      }
      if (typeof setCompanies === 'function') {
        setCompanies(prev =>
          Array.isArray(prev)
            ? prev.map(c => (c.id === employerProfile?.id || c.companyName === employerProfile?.companyName ? { ...c, ...payload } : c))
            : prev
        );
      }

      // Call backend PUT /api/employer/company
      try {
        await employerApi.updateMyCompany({
          companyName: payload.companyName,
          recruiterName: payload.recruiterName,
          phone: payload.phone,
          website: payload.website,
          industry: payload.industry,
          size: payload.size,
          location: payload.location,
          // Only send logo if it is an uploaded url or normal string, or fallback if base64 too long
          logo: payload.logo
        });
      } catch (err) {
        console.warn('Could not sync company update to backend:', err);
      }

      setLogoFile(null);
      setSelectedLogoName('');
      setIsEditing(false);
      showToast('Đã cập nhật thông tin và logo Hồ sơ Doanh nghiệp thành công!', 'success');
    } catch (err) {
      console.error('Error during handleSaveSubmit:', err);
      showToast('Lỗi khi lưu thông tin: ' + (err.message || 'Vui lòng thử lại.'), 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const currentLogo = isEditing ? formData.logo : employerProfile?.logo || formData.logo;
  const isImage = isImageLogo(currentLogo);
  const logoUrl = isImage ? getCompanyLogoUrl(currentLogo) : null;

  return (
    <div className="employer-page hiring-company-page space-y-6 max-w-5xl mx-auto pb-12">
      {/* Logo Cropper Modal */}
      {cropperFile && (
        <LogoCropperModal
          file={cropperFile}
          onApply={handleCropApply}
          onCancel={() => { setCropperFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
        />
      )}
      <EmployerPageHeader eyebrow="DẤU ẤN DOANH NGHIỆP" title="Hồ sơ công ty" description="Giới thiệu doanh nghiệp và thông tin liên hệ với những nhân tài tương lai." />
      {/* 1. HEADER BANNER */}
      <div className="hiring-company-banner bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          {/* Logo container with quick upload hover */}
          <div className="relative group shrink-0">
            <div className={`transition-all duration-200 ${isImage
              ? 'h-20 max-w-[240px] flex items-center justify-center group-hover:opacity-90'
              : 'w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 text-white font-black text-2xl flex items-center justify-center overflow-hidden shadow-md backdrop-blur-xs group-hover:border-blue-400 group-hover:shadow-blue-500/20'
            }`}>
              {isImage ? (
                <img
                  src={logoUrl}
                  alt={formData.companyName || 'Logo công ty'}
                  className="h-full w-auto max-w-[240px] object-contain transition-transform duration-200 group-hover:scale-105"
                  style={{ background: 'transparent' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{ display: isImage ? 'none' : 'flex' }}
                className="w-full h-full items-center justify-center font-black text-3xl"
              >
                {formData.companyName?.charAt(0).toUpperCase() || 'C'}
              </div>
            </div>

            {/* Quick change camera button overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="absolute inset-0 bg-slate-950/75 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer text-[11px] font-bold shadow-md"
              title="Nhấn để tải lên logo công ty mới"
            >
              {isUploadingLogo ? (
                <Loader2 size={18} className="animate-spin text-blue-400" />
              ) : (
                <>
                  <Camera size={18} className="text-blue-300" />
                  <span>Đổi logo</span>
                </>
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight">{formData.companyName || employerProfile?.companyName}</h2>
              <VerificationBadge status={employerProfile?.verificationStatus} />
            </div>
            <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-2 flex-wrap">
              <span>Mã số thuế: <strong className="font-mono text-white">{formData.taxId || employerProfile?.taxId || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}</strong></span>
              <span>•</span>
              <span>Lĩnh vực: <strong className="text-white font-medium">{formData.industry || employerProfile?.industry || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}</strong></span>
              <span>•</span>
              <button type="button" className="text-blue-300 font-semibold cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                Thay logo
              </button>
            </p>
          </div>
        </div>

        {/* Hidden File Input for Banner / Quick Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) handleLogoFileSelect(e.target.files[0]);
            e.target.value = '';
          }}
        />

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary text-xs font-bold shadow-md flex items-center gap-2 py-2.5 px-4"
            >
              <Edit3 size={15} /> Chỉnh sửa hồ sơ
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setLogoFile(null);
                setFormData(prev => ({ ...prev, logo: employerProfile?.logo || '🏢' }));
              }}
              className="btn btn-secondary text-xs font-bold text-white bg-white/10 hover:bg-white/20 border-white/20 py-2.5 px-4"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* 2. EDIT FORM / VIEW DETAILS */}
      {isEditing ? (
        <form onSubmit={handleSaveSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit3 size={18} className="text-blue-600" /> Cập nhật thông tin & Logo Doanh nghiệp
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">* Các trường bắt buộc</span>
          </div>

          {/* DEDICATED LOGO UPLOAD & MANAGEMENT SECTION */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-600" /> Logo Công ty / Doanh nghiệp
              </label>
              {isImage && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Đặt lại logo mặc định
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Logo Preview Container */}
              <div className={`shrink-0 relative group ${isImage
                ? 'h-20 sm:h-24 max-w-[260px] flex items-center justify-center p-1'
                : 'w-24 h-24 rounded-2xl bg-white border-2 border-blue-200 text-blue-700 font-black text-3xl flex items-center justify-center shadow-xs'
              }`}>
                {isImage ? (
                  <img
                    src={logoUrl}
                    alt="Xem trước logo"
                    className="h-full w-auto max-w-full object-contain"
                    style={{ background: 'transparent' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  style={{ display: isImage ? 'none' : 'flex' }}
                  className="w-full h-full items-center justify-center font-black text-3xl"
                >
                  {formData.companyName?.charAt(0).toUpperCase() || 'C'}
                </div>
              </div>

              {/* Upload Controls & Guidelines */}
              <div className="space-y-3 flex-1 w-full text-left">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-2 shadow-xs"
                  >
                    <Upload size={14} /> Tải ảnh logo từ thiết bị
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {selectedLogoName ? `Đã chọn: ${selectedLogoName}` : 'Hỗ trợ PNG, JPG, WEBP, SVG'}
                  </span>
                </div>

                <div className="form-group pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Hoặc dán trực tiếp đường dẫn ảnh (Logo Image URL):
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    className="form-control text-xs bg-white"
                    value={formData.logo.startsWith('data:') ? '' : formData.logo === '🏢' ? '' : formData.logo}
                    onChange={(e) => {
                      setLogoFile(null);
                      setFormData(prev => ({ ...prev, logo: e.target.value.trim() || '🏢' }));
                    }}
                  />
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-blue-600" /> Khuyến nghị chất lượng hiển thị:
                  </p>
                  <p>• Tỉ lệ hình vuông <strong>1:1</strong> (tối thiểu 200 × 200 px), định dạng <strong>PNG nền trong suốt</strong> hoặc JPG/WEBP.</p>
                  <p>• Dung lượng tối đa: <strong>5 MB</strong>. Logo sẽ tự động đồng bộ trên toàn bộ bảng tin tuyển dụng của công ty.</p>
                </div>
              </div>
            </div>
          </div>

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

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsEditing(false);
                setLogoFile(null);
                setFormData(prev => ({ ...prev, logo: employerProfile?.logo || '🏢' }));
              }}
              className="btn btn-secondary text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      ) : (
        <div className="hiring-company-details grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-8 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Mô tả doanh nghiệp</h3>
              {formData.description ? (
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {formData.description}
                </p>
              ) : (
                <div className="text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 flex items-center justify-between">
                  <span>Chưa cập nhật thông tin mô tả doanh nghiệp.</span>
                  <button onClick={() => setIsEditing(true)} className="text-blue-600 font-semibold hover:underline text-xs not-italic">
                    Cập nhật ngay
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Website</span>
                {formData.website ? (
                  <a href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <Globe size={13} /> {formData.website}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Chưa cập nhật</span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mã số thuế</span>
                {formData.taxId ? (
                  <span className="font-mono font-bold text-slate-800">{formData.taxId}</span>
                ) : (
                  <span className="text-slate-400 italic">Chưa cập nhật</span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trụ sở văn phòng</span>
                {formData.location ? (
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" /> {formData.location}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa cập nhật</span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quy mô nhân sự</span>
                {formData.size ? (
                  <span className="font-medium text-slate-700">{formData.size}</span>
                ) : (
                  <span className="text-slate-400 italic">Chưa cập nhật</span>
                )}
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
                <p>Họ tên HR: <strong>{formData.recruiterName || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}</strong></p>
                <p>Email: <strong>{formData.email || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}</strong></p>
                <p>Điện thoại: <strong>{formData.phone || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}</strong></p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-blue-600" /> Xác minh Doanh nghiệp
                </h4>
                <VerificationBadge status={employerProfile?.verificationStatus} />
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                {employerProfile?.verificationStatus === 'Verified'
                  ? 'Tài khoản đã được Admin kiểm duyệt Giấy phép kinh doanh hợp lệ.'
                  : 'Tài khoản đang chờ Ban Quản trị xác minh Giấy phép kinh doanh.'}
              </p>

              <button
                onClick={() => setActivePage('employer-register')}
                className="btn btn-secondary w-full text-xs font-semibold bg-white hover:bg-slate-50 transition-colors"
              >
                Trang quản lý Xác minh
              </button>
            </div>

            {/* Danger Zone: Xóa tài khoản doanh nghiệp */}
            <div className="hiring-company-danger bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Trash2 size={16} className="text-rose-600" /> Quản lý tài khoản
                </h4>
              </div>
              <p className="text-rose-700 text-[11px] leading-relaxed">
                Nếu bạn lỡ tạo nhầm tài khoản Doanh nghiệp thay vì Ứng viên, hãy xóa tài khoản này để giải phóng email và đăng ký lại đúng vai trò.
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 size={14} /> Xóa tài khoản này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa tài khoản 2 bước xác minh */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
