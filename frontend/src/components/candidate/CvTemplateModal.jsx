import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Download, Upload, Plus, Trash2, Check } from 'lucide-react';

/* ─── CSS cho slider & input trong CV chuẩn Times New Roman ─── */
const SLIDER_CSS = `
  .cv-modal-body, .cv-wrapper, .cv-wrapper * {
    font-family: 'Times New Roman', Times, serif !important;
  }
  .cv-range {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 5px; border-radius: 3px;
    outline: none; cursor: pointer; margin-top: 4px; display: block;
  }
  .cv-range::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 15px; height: 15px; border-radius: 50%;
    background: #4ade80; cursor: pointer;
    border: 2px solid rgba(255,255,255,0.7);
    box-shadow: 0 0 5px rgba(0,0,0,0.3);
  }
  .cv-range::-moz-range-thumb {
    width: 15px; height: 15px; border-radius: 50%;
    background: #4ade80; cursor: pointer;
    border: 2px solid rgba(255,255,255,0.7);
  }
  .cv-input-dark {
    background: transparent; border: none; outline: none;
    color: rgba(255,255,255,0.92); font-family: 'Times New Roman', Times, serif !important;
    width: 100%; cursor: text;
  }
  .cv-input-dark::placeholder { color: rgba(255,255,255,0.3); }
  .cv-input-dark:focus { background: rgba(255,255,255,0.08); border-radius: 4px; }
  .cv-input-light {
    background: transparent; border: none; outline: none;
    color: #1a2e4a; font-family: 'Times New Roman', Times, serif !important;
    width: 100%; cursor: text;
  }
  .cv-input-light::placeholder { color: #bbb; }
  .cv-input-light:focus { background: #f4f6ff; border-radius: 4px; }
  .cv-textarea-light {
    background: transparent; border: none; outline: none;
    color: #333; font-family: 'Times New Roman', Times, serif !important; width: 100%;
    resize: none; cursor: text; line-height: 1.6;
  }
  .cv-textarea-light::placeholder { color: #bbb; }
  .cv-textarea-light:focus { background: #f4f6ff; border-radius: 4px; }
  .cv-section-title-left {
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    color: rgba(255,255,255,0.75);
    border-bottom: 1.5px solid rgba(255,255,255,0.25);
    padding-bottom: 6px; margin-bottom: 14px; display: block; width: 100%;
  }
  .cv-section-title-right {
    font-size: 16px; font-weight: 700; text-transform: uppercase;
    color: #1a2e4a;
    border-bottom: 2px solid #1a2e4a;
    padding-bottom: 6px; margin-bottom: 14px; display: block; width: 100%;
  }
  .cv-add-btn {
    background: rgba(255,255,255,0.08);
    border: 1px dashed rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.65); border-radius: 6px;
    padding: 4px 10px; font-size: 12px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
    font-family: 'Times New Roman', Times, serif !important;
  }
  .cv-add-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
  .cv-add-btn-light {
    background: #f0f4ff; border: 1px dashed #aab4d8;
    color: #405590; border-radius: 6px;
    padding: 4px 12px; font-size: 12px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
    font-family: 'Times New Roman', Times, serif !important;
  }
  .cv-add-btn-light:hover { background: #e0e8ff; color: #203570; }
  .cv-del-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.3); padding: 0 2px;
    display: flex; align-items: center; flex-shrink: 0;
  }
  .cv-del-btn:hover { color: #f87171; }
  .cv-del-btn-light {
    background: none; border: none; cursor: pointer;
    color: #ccc; padding: 0 2px;
    display: flex; align-items: center; flex-shrink: 0;
  }
  .cv-del-btn-light:hover { color: #f87171; }
  @media print {
    body, * {
      font-family: 'Times New Roman', Times, serif !important;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  }
`;

function sliderBg(val) {
  return `linear-gradient(to right, #4ade80 0%, #4ade80 ${val}%, rgba(255,255,255,0.2) ${val}%, rgba(255,255,255,0.2) 100%)`;
}

const DEFAULT_EXPERIENCES = [
  { company: '', period: '', role: '', bullets: [''], achievement: '' },
];

export function CvTemplateModal({ isOpen, onClose, onReplaceCV, onSaveToProfile, profileData }) {
  const [cvPhoto, setCvPhoto] = useState(null);
  const cvPhotoRef = useRef(null);
  const cvRef = useRef(null);

  const [cvData, setCvData] = useState({
    name: '', desiredRole: '', phone: '', email: '',
    location: '', university: '', major: '', graduationYear: '', bio: '',
  });
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([
    { name: 'Tiếng Anh', level: 60 },
    { name: 'Tiếng Trung', level: 40 },
  ]);
  const [experiences, setExperiences] = useState(DEFAULT_EXPERIENCES);
  const [otherSkills, setOtherSkills] = useState([
    'Giao tiếp & Làm việc nhóm',
    'Quản lý thời gian',
    'Tư duy phản biện',
    'Giải quyết vấn đề'
  ]);

  useEffect(() => {
    if (isOpen && profileData) {
      setCvPhoto(profileData.avatarUrl || null);
      setCvData({
        name: profileData.name || '',
        desiredRole: profileData.desiredRole || '',
        phone: profileData.phone || '',
        email: profileData.email || '',
        location: profileData.location || '',
        university: profileData.university || '',
        major: profileData.major || '',
        graduationYear: profileData.graduationYear || '',
        bio: profileData.bio || '',
      });
      const srcSkills = Array.isArray(profileData.skills) ? profileData.skills : [];
      setSkills(srcSkills.map(s => ({
        name: typeof s === 'string' ? s : (s.name || ''),
        level: s.level ?? 75,
      })));
      if (Array.isArray(profileData.languages) && profileData.languages.length > 0) {
        setLanguages(profileData.languages.map(l => ({
          name: typeof l === 'string' ? l : (l.name || ''),
          level: l.level ?? 60
        })));
      }
      if (Array.isArray(profileData.experiences) && profileData.experiences.length > 0) {
        setExperiences(profileData.experiences.map(e => ({
          company: e.company || '',
          period: e.period || '',
          role: e.role || '',
          bullets: Array.isArray(e.bullets) ? e.bullets : (e.bullets ? [e.bullets] : ['']),
          achievement: e.achievement || ''
        })));
      }
      if (Array.isArray(profileData.otherSkills) && profileData.otherSkills.length > 0) {
        setOtherSkills(profileData.otherSkills);
      }
    }
  }, [isOpen, profileData]);

  const setField = (key, val) => setCvData(prev => ({ ...prev, [key]: val }));

  /* ─ Skills ─ */
  const setSkillName = (i, v) => setSkills(p => p.map((s, idx) => idx === i ? { ...s, name: v } : s));
  const setSkillLevel = (i, v) => setSkills(p => p.map((s, idx) => idx === i ? { ...s, level: +v } : s));
  const addSkill = () => setSkills(p => [...p, { name: 'Kỹ năng mới', level: 70 }]);
  const removeSkill = (i) => setSkills(p => p.filter((_, idx) => idx !== i));

  /* ─ Languages ─ */
  const setLangName = (i, v) => setLanguages(p => p.map((l, idx) => idx === i ? { ...l, name: v } : l));
  const setLangLevel = (i, v) => setLanguages(p => p.map((l, idx) => idx === i ? { ...l, level: +v } : l));
  const addLang = () => setLanguages(p => [...p, { name: 'Ngôn ngữ mới', level: 50 }]);
  const removeLang = (i) => setLanguages(p => p.filter((_, idx) => idx !== i));

  /* ─ Experiences ─ */
  const setExpField = (i, key, val) => setExperiences(p => p.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  const setBullet = (ei, bi, val) => setExperiences(p => p.map((e, idx) => idx === ei
    ? { ...e, bullets: e.bullets.map((b, bidx) => bidx === bi ? val : b) } : e));
  const addBullet = (ei) => setExperiences(p => p.map((e, idx) => idx === ei ? { ...e, bullets: [...e.bullets, ''] } : e));
  const removeBullet = (ei, bi) => setExperiences(p => p.map((e, idx) => idx === ei
    ? { ...e, bullets: e.bullets.filter((_, bidx) => bidx !== bi) } : e));
  const addExp = () => setExperiences(p => [...p, { company: '', period: '', role: '', bullets: [''], achievement: '' }]);
  const removeExp = (i) => setExperiences(p => p.filter((_, idx) => idx !== i));

  /* ─ Other Skills (Độc lập với Kỹ năng cột trái) ─ */
  const setOtherSkill = (i, v) => setOtherSkills(p => p.map((s, idx) => idx === i ? v : s));
  const addOtherSkill = () => setOtherSkills(p => [...p, 'Kỹ năng mới']);
  const removeOtherSkill = (i) => setOtherSkills(p => p.filter((_, idx) => idx !== i));

  /* ─ Upload ảnh ─ */
  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCvPhoto(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  /* ─ Tổng hợp nội dung CV thành văn bản thuần túy cho AI Deep Matching ─ */
  const generateCvText = useCallback(() => {
    const lines = [];
    lines.push(`HỒ SƠ ỨNG VIÊN CÔNG NGHỆ THÔNG TIN: ${(cvData.name || '').toUpperCase()}`);
    if (cvData.desiredRole) lines.push(`Vị trí ứng tuyển mục tiêu: ${cvData.desiredRole}`);

    lines.push('\n--- THÔNG TIN LIÊN HỆ ---');
    if (cvData.phone) lines.push(`Điện thoại: ${cvData.phone}`);
    if (cvData.email) lines.push(`Email: ${cvData.email}`);
    if (cvData.location) lines.push(`Địa chỉ: ${cvData.location}`);

    lines.push('\n--- HỌC VẤN ---');
    if (cvData.university) lines.push(`Trường: ${cvData.university}`);
    if (cvData.major) lines.push(`Chuyên ngành: ${cvData.major}`);
    if (cvData.graduationYear) lines.push(`Năm tốt nghiệp: ${cvData.graduationYear}`);

    if (cvData.bio && cvData.bio.trim()) {
      lines.push('\n--- MỤC TIÊU NGHỀ NGHIỆP ---');
      lines.push(cvData.bio.trim());
    }

    if (skills.length > 0) {
      lines.push('\n--- KỸ NĂNG CÔNG NGHỆ & LẬP TRÌNH ---');
      skills.forEach(s => lines.push(`- ${s.name}: ${s.level}%`));
    }

    if (languages.length > 0) {
      lines.push('\n--- TRÌNH ĐỘ NGOẠI NGỮ ---');
      languages.forEach(l => lines.push(`- ${l.name}: ${l.level}%`));
    }

    if (experiences.some(e => e.company || e.role)) {
      lines.push('\n--- KINH NGHIỆM LÀM VIỆC & DỰ ÁN ---');
      experiences.forEach(exp => {
        if (exp.company || exp.role) {
          lines.push(`* Công ty: ${exp.company || 'Doanh nghiệp'} (${exp.period || 'Hiện tại'})`);
          if (exp.role) lines.push(`  Vị trí: ${exp.role}`);
          if (exp.bullets && exp.bullets.length > 0) {
            exp.bullets.filter(Boolean).forEach(b => lines.push(`  • ${b}`));
          }
          if (exp.achievement) lines.push(`  Thành tích: ${exp.achievement}`);
        }
      });
    }

    if (otherSkills.length > 0) {
      lines.push('\n--- KỸ NĂNG MỀM & KỸ NĂNG KHÁC ---');
      otherSkills.filter(Boolean).forEach(os => lines.push(`- ${os}`));
    }

    return lines.join('\n');
  }, [cvData, skills, languages, experiences, otherSkills]);

  /* ─ Lưu trực tiếp vào Hồ sơ ứng viên & Đồng bộ AI ─ */
  const handleSaveAndApply = useCallback(() => {
    const text = generateCvText();
    const safeName = (cvData.name || 'Ung_Vien').trim().replace(/\s+/g, '_');
    const fileName = `CV_${safeName}.pdf`;

    if (onSaveToProfile) {
      onSaveToProfile({
        cvFileName: fileName,
        extractedCvText: text,
        skills: [...new Set([...skills.map(s => s.name).filter(Boolean), ...otherSkills.filter(Boolean)])],
        formUpdates: {
          name: cvData.name,
          desiredRole: cvData.desiredRole,
          phone: cvData.phone,
          email: cvData.email,
          location: cvData.location,
          university: cvData.university,
          major: cvData.major,
          graduationYear: cvData.graduationYear,
          bio: cvData.bio
        }
      });
    }
    if (onClose) onClose();
  }, [generateCvText, cvData, skills, onSaveToProfile, onClose]);

  /* ─ In PDF Chuẩn A4 Pixel-Perfect (Không mất định dạng) ─ */
  const handlePrint = useCallback(() => {
    const content = cvRef.current; if (!content) return;
    const clone = content.cloneNode(true);

    // 1. Thay thế input[type="range"] bằng thanh progress bar chuẩn đẹp (thay vì in số thô kệch)
    clone.querySelectorAll('input[type="range"]').forEach(inp => {
      const val = Math.max(0, Math.min(100, Number(inp.value) || 0));
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = 'width: 100%; height: 6px; background: rgba(255,255,255,0.22); border-radius: 3px; overflow: hidden; margin-top: 5px;';
      const barFill = document.createElement('div');
      barFill.style.cssText = `width: ${val}%; height: 100%; background: #4ade80; border-radius: 3px;`;
      barWrapper.appendChild(barFill);
      inp.parentNode.replaceChild(barWrapper, inp);
    });

    // 2. Chuyển các input text sang span
    clone.querySelectorAll('input').forEach(inp => {
      const span = document.createElement('span');
      span.textContent = inp.value || '';
      span.style.cssText = inp.style.cssText;
      span.className = inp.className;
      if (inp.style.display === 'block') {
        span.style.display = 'block';
      } else {
        span.style.display = 'inline-block';
      }
      span.style.fontFamily = "'Times New Roman', Times, serif";
      inp.parentNode.replaceChild(span, inp);
    });

    // 3. Chuyển các textarea sang span
    clone.querySelectorAll('textarea').forEach(ta => {
      const span = document.createElement('span');
      span.textContent = ta.value || '';
      span.style.cssText = ta.style.cssText;
      span.style.whiteSpace = 'pre-wrap';
      span.style.display = 'block';
      span.style.fontFamily = "'Times New Roman', Times, serif";
      ta.parentNode.replaceChild(span, ta);
    });

    // 4. Xóa các nút tương tác
    clone.querySelectorAll('.cv-add-btn,.cv-add-btn-light,.cv-del-btn,.cv-del-btn-light').forEach(el => el.remove());

    const printWindow = window.open('', '_blank', 'width=980,height=800');
    if (!printWindow) {
      alert('Vui lòng cấp quyền mở pop-up để hệ thống xuất bản in CV.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>CV - ${cvData.name || 'CareerFit'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Times New Roman', Times, serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          width: 210mm !important;
          min-height: 297mm !important;
          font-family: 'Times New Roman', Times, serif !important;
        }
        .cv-wrapper {
          display: flex !important;
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
        .cv-left {
          width: 270px !important;
          min-width: 270px !important;
          background: #1a2e4a !important;
          color: white !important;
          padding: 36px 22px !important;
          min-height: 297mm !important;
        }
        .cv-right {
          flex: 1 !important;
          background: white !important;
          padding: 40px 36px !important;
          min-height: 297mm !important;
        }
        .cv-section-title-left {
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          border-bottom: 1.5px solid rgba(255,255,255,0.25);
          padding-bottom: 6px; margin-bottom: 14px; display: block; width: 100%;
        }
        .cv-section-title-right {
          font-size: 16px; font-weight: 700; text-transform: uppercase;
          color: #1a2e4a;
          border-bottom: 2px solid #1a2e4a;
          padding-bottom: 6px; margin-bottom: 14px; display: block; width: 100%;
        }
        @media print {
          body {
            width: 210mm;
            height: 297mm;
          }
        }
      </style>
    </head><body>${clone.outerHTML}</body></html>`);

    printWindow.document.close();
    printWindow.focus();

    printWindow.onafterprint = () => {
      try { printWindow.close(); } catch (_) {}
    };

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }, [cvData.name]);

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
      <style>{SLIDER_CSS}</style>

      <div className="cv-modal-body" style={{ background:'#f0f2f5', borderRadius:'16px', width:'100%', maxWidth:'940px', maxHeight:'95vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0', marginBottom:'14px' }}>
          <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#1a2e4a', margin:0 }}>🎓 CV Chuyên nghiệp — Chỉnh sửa trực tiếp</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#666', padding:'4px' }}><X size={22}/></button>
        </div>

        {/* Upload ảnh */}
        <div style={{ padding:'0 24px 12px', display:'flex', alignItems:'center', gap:'10px' }}>
          <button type="button" onClick={() => cvPhotoRef.current?.click()} style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'13px', background:'#e8f0fe', color:'#1a56db', border:'none', borderRadius:'8px', padding:'7px 14px', cursor:'pointer', fontWeight:'600' }}>
            <Upload size={14}/> Tải ảnh lên cho CV
          </button>
          <span style={{ fontSize:'12px', color:'#777' }}>Ảnh này chỉ dùng trong CV, không thay ảnh hồ sơ</span>
          <input ref={cvPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoUpload}/>
        </div>

        {/* ════ KHUNG CV ════ */}
        <div style={{ padding:'0 24px' }}>
          <div ref={cvRef} className="cv-wrapper" style={{ display:'flex', minHeight:'750px', borderRadius:'12px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>

            {/* ══ CỘT TRÁI ══ */}
            <div className="cv-left" style={{ width:'265px', minWidth:'265px', background:'#1a2e4a', color:'white', padding:'32px 22px' }}>

              {/* Ảnh */}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'26px' }}>
                {cvPhoto
                  ? <img src={cvPhoto} alt="Ảnh CV" style={{ width:'115px', height:'115px', borderRadius:'50%', border:'4px solid rgba(255,255,255,0.3)', objectFit:'cover' }}/>
                  : <div style={{ width:'115px', height:'115px', borderRadius:'50%', border:'4px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', fontWeight:'bold', color:'rgba(255,255,255,0.8)' }}>
                      {cvData.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                }
              </div>

              {/* LIÊN LẠC */}
              <span className="cv-section-title-left">LIÊN LẠC</span>
              <div style={{ marginBottom:'18px' }}>
                {[['📞','phone','Số điện thoại'],['✉️','email','Email liên hệ'],['📍','location','Địa chỉ']].map(([ic, key, ph]) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                    <span style={{ fontSize:'13px', flexShrink:0 }}>{ic}</span>
                    <input className="cv-input-dark" value={cvData[key]} onChange={e => setField(key, e.target.value)} placeholder={ph} style={{ fontSize:'13px' }}/>
                  </div>
                ))}
              </div>

              {/* HỌC VẤN */}
              <span className="cv-section-title-left">HỌC VẤN</span>
              <div style={{ marginBottom:'18px' }}>
                <input className="cv-input-dark" value={cvData.graduationYear} onChange={e => setField('graduationYear', e.target.value)} placeholder="Năm tốt nghiệp (VD: 2022 - 2026)" style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'4px' }}/>
                <input className="cv-input-dark" value={cvData.university} onChange={e => setField('university', e.target.value)} placeholder="Tên trường Đại học / Cao đẳng" style={{ fontSize:'13px', fontWeight:'700', textTransform:'uppercase', display:'block', marginBottom:'4px' }}/>
                <input className="cv-input-dark" value={cvData.major} onChange={e => setField('major', e.target.value)} placeholder="Chuyên ngành đào tạo" style={{ fontSize:'12.5px', fontStyle:'italic', color:'rgba(255,255,255,0.8)', display:'block' }}/>
              </div>

              {/* KỸ NĂNG */}
              <span className="cv-section-title-left">KỸ NĂNG</span>
              <div style={{ marginBottom:'8px' }}>
                {skills.map((sk, i) => (
                  <div key={i} style={{ marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <input className="cv-input-dark" value={sk.name} onChange={e => setSkillName(i, e.target.value)} style={{ fontSize:'13px', flex:1 }}/>
                      <span style={{ fontSize:'12px', color:'#4ade80', marginLeft:'6px', minWidth:'35px', textAlign:'right', flexShrink:0, fontWeight:'600' }}>{sk.level}%</span>
                      <button className="cv-del-btn" onClick={() => removeSkill(i)} style={{ marginLeft:'4px' }} title="Xóa"><Trash2 size={12}/></button>
                    </div>
                    <input type="range" min="0" max="100" value={sk.level} onChange={e => setSkillLevel(i, e.target.value)}
                      className="cv-range" style={{ background: sliderBg(sk.level) }}/>
                  </div>
                ))}
                <button className="cv-add-btn" onClick={addSkill}><Plus size={12}/> Thêm kỹ năng</button>
              </div>

              {/* NGOẠI NGỮ */}
              <span className="cv-section-title-left" style={{ marginTop:'20px', display:'block' }}>NGOẠI NGỮ</span>
              <div style={{ marginBottom:'8px' }}>
                {languages.map((lg, i) => (
                  <div key={i} style={{ marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <input className="cv-input-dark" value={lg.name} onChange={e => setLangName(i, e.target.value)} style={{ fontSize:'13px', flex:1 }}/>
                      <span style={{ fontSize:'12px', color:'#4ade80', marginLeft:'6px', minWidth:'35px', textAlign:'right', flexShrink:0, fontWeight:'600' }}>{lg.level}%</span>
                      <button className="cv-del-btn" onClick={() => removeLang(i)} style={{ marginLeft:'4px' }} title="Xóa"><Trash2 size={12}/></button>
                    </div>
                    <input type="range" min="0" max="100" value={lg.level} onChange={e => setLangLevel(i, e.target.value)}
                      className="cv-range" style={{ background: sliderBg(lg.level) }}/>
                  </div>
                ))}
                <button className="cv-add-btn" onClick={addLang}><Plus size={12}/> Thêm ngôn ngữ</button>
              </div>
            </div>

            {/* ══ CỘT PHẢI ══ */}
            <div className="cv-right" style={{ flex:1, background:'white', padding:'40px 36px' }}>

              {/* Tên & Chức danh — Form đồng nhất, đậm đều, Times New Roman */}
              <div style={{ paddingBottom:'16px', borderBottom:'2px solid #e8edf2', marginBottom:'0' }}>
                <input
                  className="cv-input-light"
                  value={cvData.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="HỌ VÀ TÊN"
                  style={{
                    fontSize:'32px',
                    fontWeight:'700',
                    color:'#1a2e4a',
                    marginBottom:'4px',
                    lineHeight:'1.2'
                  }}
                />
                <input
                  className="cv-input-light"
                  value={cvData.desiredRole}
                  onChange={e => setField('desiredRole', e.target.value)}
                  placeholder="VỊ TRÍ MỤC TIÊU (VD: FRONTEND REACT DEVELOPER)"
                  style={{
                    fontSize:'13.5px',
                    color:'#666',
                    textTransform:'uppercase',
                    fontWeight:'600'
                  }}
                />
              </div>

              {/* MỤC TIÊU NGHỀ NGHIỆP */}
              <div style={{ marginTop:'22px' }}>
                <span className="cv-section-title-right">MỤC TIÊU NGHỀ NGHIỆP</span>
                <textarea
                  className="cv-textarea-light"
                  rows={3}
                  value={cvData.bio}
                  onChange={e => setField('bio', e.target.value)}
                  placeholder="Mô tả mục tiêu nghề nghiệp, thế mạnh và định hướng phát triển của bạn..."
                  style={{ fontSize:'14px', width:'100%' }}
                />
              </div>

              {/* KINH NGHIỆM LÀM VIỆC — Timeline */}
              <div style={{ marginTop:'24px' }}>
                <span className="cv-section-title-right">KINH NGHIỆM LÀM VIỆC</span>

                {experiences.map((exp, ei) => (
                  <div key={ei} style={{ display:'flex', gap:'0', marginBottom:'22px', position:'relative' }}>

                    {/* Cột trái: Công ty + Thời gian */}
                    <div style={{ width:'140px', minWidth:'140px', paddingRight:'14px', paddingTop:'2px' }}>
                      <input
                        className="cv-input-light"
                        value={exp.company}
                        onChange={e => setExpField(ei, 'company', e.target.value)}
                        placeholder="Tên công ty"
                        style={{ fontSize:'14px', fontWeight:'700', color:'#1a2e4a', display:'block', marginBottom:'3px' }}
                      />
                      <input
                        className="cv-input-light"
                        value={exp.period}
                        onChange={e => setExpField(ei, 'period', e.target.value)}
                        placeholder="MM/YYYY - MM/YYYY"
                        style={{ fontSize:'12px', color:'#777', display:'block' }}
                      />
                    </div>

                    {/* Đường kẻ dọc + chấm tròn */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:'14px', flexShrink:0 }}>
                      <div style={{ width:'11px', height:'11px', borderRadius:'50%', background:'#1a2e4a', flexShrink:0, marginTop:'5px' }}/>
                      <div style={{ width:'2px', flex:1, background:'#cbd5e1', minHeight:'40px', marginTop:'3px' }}/>
                    </div>

                    {/* Cột phải: Chức danh + Bullets + Thành tích + Nút xoá */}
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                        <input
                          className="cv-input-light"
                          value={exp.role}
                          onChange={e => setExpField(ei, 'role', e.target.value)}
                          placeholder="Chức danh / Vị trí công việc"
                          style={{ fontSize:'15px', fontWeight:'700', color:'#1a2e4a', flex:1 }}
                        />
                        {experiences.length > 1 && (
                          <button className="cv-del-btn-light" onClick={() => removeExp(ei)} title="Xóa kinh nghiệm này" style={{ marginLeft:'6px' }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>

                      {/* Bullet points */}
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} style={{ display:'flex', alignItems:'flex-start', gap:'6px', marginBottom:'5px' }}>
                          <span style={{ fontSize:'14px', color:'#1a2e4a', flexShrink:0, marginTop:'1px' }}>•</span>
                          <input
                            className="cv-input-light"
                            value={b}
                            onChange={e => setBullet(ei, bi, e.target.value)}
                            placeholder="Mô tả công việc, trách nhiệm, dự án thực hiện..."
                            style={{ fontSize:'13.5px', flex:1 }}
                          />
                          {exp.bullets.length > 1 && (
                            <button className="cv-del-btn-light" onClick={() => removeBullet(ei, bi)} title="Xóa dòng"><X size={12}/></button>
                          )}
                        </div>
                      ))}
                      <button className="cv-add-btn-light" onClick={() => addBullet(ei)} style={{ marginBottom:'8px' }}>
                        <Plus size={11}/> Thêm mô tả
                      </button>

                      {/* Thành tích */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
                        <span style={{ fontSize:'13px', fontWeight:'700', color:'#1a2e4a', flexShrink:0 }}>Thành tích đạt được:</span>
                        <input
                          className="cv-input-light"
                          value={exp.achievement}
                          onChange={e => setExpField(ei, 'achievement', e.target.value)}
                          placeholder="VD: Nhân viên xuất sắc năm 2024"
                          style={{ fontSize:'13px', color:'#444', flex:1 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button className="cv-add-btn-light" onClick={addExp}>
                  <Plus size={12}/> Thêm kinh nghiệm
                </button>
              </div>

              {/* KỸ NĂNG KHÁC (Hoàn toàn độc lập, cho phép tự do nhập/thêm/xóa) */}
              <div style={{ marginTop:'24px' }}>
                <span className="cv-section-title-right">KỸ NĂNG KHÁC</span>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px', marginTop:'8px' }}>
                  {otherSkills.map((sk, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'14px', color:'#1a2e4a', flexShrink:0 }}>•</span>
                      <input
                        className="cv-input-light"
                        value={sk}
                        onChange={e => setOtherSkill(i, e.target.value)}
                        placeholder="Nhập kỹ năng khác..."
                        style={{ fontSize:'13.5px', flex:1 }}
                      />
                      {otherSkills.length > 1 && (
                        <button
                          className="cv-del-btn-light"
                          onClick={() => removeOtherSkill(i)}
                          title="Xóa kỹ năng này"
                        >
                          <X size={12}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="cv-add-btn-light" onClick={addOtherSkill} style={{ marginTop:'10px' }}>
                  <Plus size={11}/> Thêm kỹ năng khác
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display:'flex', gap:'12px', padding:'20px 24px 24px', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:'12.5px', color:'#64748b', display:'flex', alignItems:'center', gap:'6px' }}>
            <span>💡 <strong>Mẹo in:</strong> Chọn máy in đích <strong>"Lưu dưới dạng PDF" (Save as PDF)</strong> để chữ sắc nét & AI đọc tốt nhất.</span>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <button type="button" onClick={onReplaceCV} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 16px', borderRadius:'10px', border:'1.5px solid #d1d5db', background:'white', color:'#374151', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
              <Upload size={15}/> Đổi tệp CV khác
            </button>
            <button type="button" onClick={onClose} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 16px', borderRadius:'10px', border:'1.5px solid #d1d5db', background:'white', color:'#374151', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
              <X size={15}/> Đóng
            </button>
            <button type="button" onClick={handleSaveAndApply} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:'none', background:'#16a34a', color:'white', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 8px rgba(22,163,74,0.3)' }}>
              <Check size={16}/> Lưu vào Hồ sơ & Đồng bộ AI
            </button>
            <button type="button" onClick={handlePrint} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', border:'none', background:'#1a2e4a', color:'white', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 8px rgba(26,46,74,0.3)' }}>
              <Download size={15}/> Tải CV về máy (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
