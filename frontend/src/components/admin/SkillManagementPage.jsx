import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  X
} from 'lucide-react';

export function SkillManagementPage() {
  const {
    skillsCatalog,
    addSkillToCatalog,
    updateSkillCatalog,
    removeSkillFromCatalog,
    refreshSkillsCatalog,
    jobs,
    candidateProfile,
    showToast
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkillForm, setNewSkillForm] = useState({ name: '', category: 'Backend', description: '' });

  const [editingSkill, setEditingSkill] = useState(null);
  const [editSkillForm, setEditSkillForm] = useState({ name: '', category: 'Backend', description: '' });

  const [deletingSkill, setDeletingSkill] = useState(null);

  const categories = ['Backend', 'Frontend', 'Database', 'DevOps', 'Testing', 'Tools', 'Fundamentals'];

  // Filtered skills
  const filteredSkills = skillsCatalog.filter(skill => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || skill.name.toLowerCase().includes(q) || (skill.description && skill.description.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'All' || skill.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getJobUsageCount = (skillName) => {
    return (jobs || []).filter(j => j.skills && j.skills.some(s => s.toLowerCase() === skillName.toLowerCase())).length;
  };

  const getCandidateUsageCount = (skillName) => {
    if (!candidateProfile || !candidateProfile.skills) return 0;
    return candidateProfile.skills.some(s => s.toLowerCase() === skillName.toLowerCase()) ? 1 : 0;
  };

  const handleCreateSkillSubmit = async (e) => {
    e.preventDefault();
    if (!newSkillForm.name.trim()) {
      showToast('Vui lòng nhập tên kỹ năng.', 'danger');
      return;
    }
    const success = await addSkillToCatalog(newSkillForm.name.trim(), newSkillForm.category, newSkillForm.description.trim());
    if (success) {
      setIsAddModalOpen(false);
      setNewSkillForm({ name: '', category: 'Backend', description: '' });
    }
  };

  const handleEditSkillSubmit = async (e) => {
    e.preventDefault();
    if (!editingSkill || !editSkillForm.name.trim()) return;
    await updateSkillCatalog(editingSkill.id, {
      name: editSkillForm.name.trim(),
      category: editSkillForm.category,
      description: editSkillForm.description.trim()
    });
    setEditingSkill(null);
  };

  const handleDeleteSkillConfirm = async () => {
    if (deletingSkill) {
      await removeSkillFromCatalog(deletingSkill.id);
      setDeletingSkill(null);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Danh mục kỹ năng
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Quản lý từ điển kỹ năng chuẩn hóa dùng trong thuật toán so khớp CV-JD và phân tích khoảng trống năng lực IT.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refreshSkillsCatalog?.();
                showToast('Đã làm mới danh mục kỹ năng!', 'success');
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className="btn btn-secondary text-xs font-semibold h-10 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Đồng bộ danh mục kỹ năng từ máy chủ"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Thêm Kỹ năng mới
          </button>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
            categoryFilter === 'All'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tất cả ({skillsCatalog.length})
        </button>
        {categories.map(cat => {
          const count = skillsCatalog.filter(s => s.category === cat).length;
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="Tìm theo tên kỹ năng hoặc mô tả chuyên môn..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Enterprise Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Tên kỹ năng</th>
                <th className="py-3.5 px-4">Phân loại (Category)</th>
                <th className="py-3.5 px-4">Mô tả chuẩn hóa</th>
                <th className="py-3.5 px-4 text-center">Tin tuyển dụng cần</th>
                <th className="py-3.5 px-4 text-center">Ứng viên sở hữu</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {filteredSkills.map(skill => {
                const jobCount = getJobUsageCount(skill.name);
                const candCount = getCandidateUsageCount(skill.name);

                return (
                  <tr key={skill.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {skill.name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {skill.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                      {skill.description || 'Kỹ năng chuyên môn công nghệ thông tin tiêu chuẩn.'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {jobCount > 0 ? `${jobCount} tin` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {candCount > 0 ? `${candCount} hồ sơ` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSkill(skill);
                            setEditSkillForm({
                              name: skill.name,
                              category: skill.category,
                              description: skill.description || ''
                            });
                          }}
                          className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
                          title="Chỉnh sửa kỹ năng"
                        >
                          <Edit3 size={13} className="mr-1 inline" /> Sửa
                        </button>
                        <button
                          onClick={() => setDeletingSkill(skill)}
                          className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                          title="Xóa kỹ năng khỏi từ điển"
                        >
                          <Trash2 size={13} className="mr-1 inline" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSkills.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    Không tìm thấy kỹ năng nào phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add Skill Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Thêm Kỹ năng mới vào Danh mục"
        >
          <form onSubmit={handleCreateSkillSubmit} className="space-y-4 text-sm">
            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tên kỹ năng chuẩn *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ví dụ: Docker, Kubernetes, Next.js..."
                value={newSkillForm.name}
                onChange={e => setNewSkillForm({ ...newSkillForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Phân loại chuyên môn (Category) *</label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newSkillForm.category}
                onChange={e => setNewSkillForm({ ...newSkillForm, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Mô tả / Định nghĩa kỹ năng</label>
              <textarea
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
                placeholder="Mô tả tóm tắt về kỹ năng hoặc công nghệ..."
                value={newSkillForm.description}
                onChange={e => setNewSkillForm({ ...newSkillForm, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                Lưu kỹ năng mới
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Edit Skill Modal */}
      {editingSkill && (
        <Modal
          isOpen={!!editingSkill}
          onClose={() => setEditingSkill(null)}
          title={`Chỉnh sửa kỹ năng: ${editingSkill.name}`}
        >
          <form onSubmit={handleEditSkillSubmit} className="space-y-4 text-sm">
            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tên kỹ năng chuẩn *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={editSkillForm.name}
                onChange={e => setEditSkillForm({ ...editSkillForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Phân loại chuyên môn *</label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={editSkillForm.category}
                onChange={e => setEditSkillForm({ ...editSkillForm, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Mô tả / Định nghĩa</label>
              <textarea
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
                value={editSkillForm.description}
                onChange={e => setEditSkillForm({ ...editSkillForm, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                Cập nhật kỹ năng
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Delete Skill Modal */}
      {deletingSkill && (
        <Modal
          isOpen={!!deletingSkill}
          onClose={() => setDeletingSkill(null)}
          title="Xác nhận xóa kỹ năng"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>
                Việc xóa kỹ năng này có thể ảnh hưởng đến kết quả so khớp CV-JD của các tin tuyển dụng và lộ trình học tập đang tham chiếu.
              </span>
            </div>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa kỹ năng <strong className="text-slate-900">{deletingSkill.name}</strong> khỏi danh mục không?
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingSkill(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSkillConfirm}
                className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
