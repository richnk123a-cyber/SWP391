import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  ExternalLink,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export function RoadmapManagementPage() {
  const {
    roadmaps,
    createRoadmap,
    updateRoadmap,
    deleteRoadmap,
    addRoadmapTopic,
    updateRoadmapTopic,
    deleteRoadmapTopic,
    reorderRoadmapTopic,
    skillsCatalog,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');

  // Active Editor state (null = Roadmap List View, or roadmapId string = Editor View)
  const [activeEditorRoadmapId, setActiveEditorRoadmapId] = useState(null);

  // Modals
  const [isCreateRoadmapModalOpen, setIsCreateRoadmapModalOpen] = useState(false);
  const [newRoadmapForm, setNewRoadmapForm] = useState({ skill: 'Spring Boot', targetRole: '', description: '' });

  const [editingRoadmapMeta, setEditingRoadmapMeta] = useState(null);

  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    estimatedTime: '5 giờ',
    resource: '',
    url: '',
    resourceType: 'Official Documentation'
  });

  const [editingTopic, setEditingTopic] = useState(null);
  const [editTopicForm, setEditTopicForm] = useState({
    title: '',
    estimatedTime: '',
    resource: '',
    url: '',
    resourceType: 'Official Documentation'
  });

  const [deletingRoadmap, setDeletingRoadmap] = useState(null);

  const resourceTypes = [
    'Official Documentation',
    'Course',
    'Video Tutorial',
    'Technical Article',
    'Professional Certificate'
  ];

  // Filtered Roadmaps
  const filteredRoadmaps = roadmaps.filter(rm => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rm.targetRole.toLowerCase().includes(q) ||
      rm.skill.toLowerCase().includes(q) ||
      (rm.description && rm.description.toLowerCase().includes(q));

    const matchesSkill = selectedSkillFilter === 'All' || rm.skill === selectedSkillFilter;
    return matchesSearch && matchesSkill;
  });

  const activeRoadmap = roadmaps.find(rm => rm.id === activeEditorRoadmapId) || null;

  const handleCreateRoadmapSubmit = (e) => {
    e.preventDefault();
    if (!newRoadmapForm.targetRole.trim()) {
      showToast('Vui lòng nhập vị trí mục tiêu cho Roadmap.', 'danger');
      return;
    }
    const created = createRoadmap(newRoadmapForm);
    setIsCreateRoadmapModalOpen(false);
    setNewRoadmapForm({ skill: 'Spring Boot', targetRole: '', description: '' });
    if (created && created.id) {
      setActiveEditorRoadmapId(created.id);
    }
  };

  const handleAddTopicSubmit = (e) => {
    e.preventDefault();
    if (!newTopicForm.title.trim() || !activeEditorRoadmapId) {
      showToast('Vui lòng nhập tiêu đề chủ đề.', 'danger');
      return;
    }
    addRoadmapTopic(activeEditorRoadmapId, newTopicForm);
    setIsAddTopicModalOpen(false);
    setNewTopicForm({
      title: '',
      estimatedTime: '5 giờ',
      resource: '',
      url: '',
      resourceType: 'Official Documentation'
    });
  };

  const handleEditTopicSubmit = (e) => {
    e.preventDefault();
    if (!editingTopic || !editTopicForm.title.trim() || !activeEditorRoadmapId) return;
    updateRoadmapTopic(activeEditorRoadmapId, editingTopic.id, editTopicForm);
    setEditingTopic(null);
  };

  const handleEditRoadmapMetaSubmit = (e) => {
    e.preventDefault();
    if (!editingRoadmapMeta) return;
    updateRoadmap(editingRoadmapMeta.id, {
      targetRole: editingRoadmapMeta.targetRole,
      skill: editingRoadmapMeta.skill,
      description: editingRoadmapMeta.description
    });
    setEditingRoadmapMeta(null);
  };

  const handleDeleteRoadmapConfirm = () => {
    if (deletingRoadmap) {
      deleteRoadmap(deletingRoadmap.id);
      if (activeEditorRoadmapId === deletingRoadmap.id) {
        setActiveEditorRoadmapId(null);
      }
      setDeletingRoadmap(null);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {activeEditorRoadmapId && (
              <button
                onClick={() => setActiveEditorRoadmapId(null)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer mr-2"
              >
                <ArrowLeft size={15} /> Quay lại danh sách
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
            {activeRoadmap ? `Lộ trình: ${activeRoadmap.targetRole}` : 'Quản lý Roadmap'}
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {activeRoadmap
              ? `Biên tập và sắp xếp các module chủ đề kiến thức cho kỹ năng ${activeRoadmap.skill}.`
              : 'Quản lý lộ trình học tập chuẩn hóa, định hướng phát triển kỹ năng cho ứng viên IT.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeRoadmap ? (
            <button
              onClick={() => setIsAddTopicModalOpen(true)}
              className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Thêm chủ đề mới
            </button>
          ) : (
            <button
              onClick={() => setIsCreateRoadmapModalOpen(true)}
              className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Tạo Lộ trình mới
            </button>
          )}
        </div>
      </div>

      {/* ==================== VIEW 1: ROADMAP LIST VIEW ==================== */}
      {!activeRoadmap && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Tìm kiếm theo vị trí mục tiêu hoặc kỹ năng liên kết..."
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

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedSkillFilter}
                onChange={e => setSelectedSkillFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="All">Tất cả kỹ năng ({roadmaps.length})</option>
                {skillsCatalog.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roadmap Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoadmaps.map(rm => (
              <div
                key={rm.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                      {rm.skill}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {rm.topics ? rm.topics.length : 0} chủ đề
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{rm.targetRole}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {rm.description || `Lộ trình phát triển chuyên sâu cho vị trí ${rm.targetRole}.`}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveEditorRoadmapId(rm.id)}
                    className="btn btn-primary text-xs font-semibold h-8 px-3 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <BookOpen size={13} /> Soạn nội dung ({rm.topics ? rm.topics.length : 0})
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingRoadmapMeta(rm)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Chỉnh sửa thông tin lộ trình"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeletingRoadmap(rm)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa lộ trình"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredRoadmaps.length === 0 && (
              <div className="col-span-full py-14 text-center bg-white rounded-xl border border-slate-200/90 text-slate-400 text-sm">
                Không tìm thấy lộ trình học tập nào phù hợp.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: TOPIC EDITOR VIEW ==================== */}
      {activeRoadmap && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kỹ năng mục tiêu</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{activeRoadmap.skill} • {activeRoadmap.targetRole}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                Tổng cộng {activeRoadmap.topics ? activeRoadmap.topics.length : 0} Module chủ đề
              </span>
            </div>
          </div>

          {/* Structured Topic List */}
          <div className="space-y-3">
            {activeRoadmap.topics && activeRoadmap.topics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Index number + Title + Meta */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">{topic.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Clock size={13} /> {topic.estimatedTime || '5 giờ'}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {topic.resourceType || 'Official Documentation'}
                      </span>
                      {topic.url && (
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                        >
                          <ExternalLink size={12} /> {topic.resource || 'Tài liệu liên kết'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Reorder & Action Controls */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {/* Move Up */}
                  <button
                    disabled={index === 0}
                    onClick={() => reorderRoadmapTopic(activeRoadmap.id, topic.id, 'up')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Di chuyển lên"
                  >
                    <ArrowUp size={16} />
                  </button>
                  {/* Move Down */}
                  <button
                    disabled={index === (activeRoadmap.topics.length - 1)}
                    onClick={() => reorderRoadmapTopic(activeRoadmap.id, topic.id, 'down')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Di chuyển xuống"
                  >
                    <ArrowDown size={16} />
                  </button>

                  <div className="w-px h-5 bg-slate-200 mx-1" />

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditingTopic(topic);
                      setEditTopicForm({
                        title: topic.title,
                        estimatedTime: topic.estimatedTime || '5 giờ',
                        resource: topic.resource || '',
                        url: topic.url || '',
                        resourceType: topic.resourceType || 'Official Documentation'
                      });
                    }}
                    className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
                  >
                    <Edit3 size={13} className="mr-1 inline" /> Sửa
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteRoadmapTopic(activeRoadmap.id, topic.id)}
                    className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={13} className="mr-1 inline" /> Xóa
                  </button>
                </div>
              </div>
            ))}

            {(!activeRoadmap.topics || activeRoadmap.topics.length === 0) && (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 text-slate-400 text-sm space-y-3">
                <p>Lộ trình này chưa có chủ đề học tập nào.</p>
                <button
                  onClick={() => setIsAddTopicModalOpen(true)}
                  className="btn btn-primary text-xs font-semibold h-9 px-4 rounded-lg inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Thêm chủ đề đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* 1. Create Roadmap Modal */}
      {isCreateRoadmapModalOpen && (
        <Modal
          isOpen={isCreateRoadmapModalOpen}
          onClose={() => setIsCreateRoadmapModalOpen(false)}
          title="Tạo Lộ trình học tập mới"
        >
          <form onSubmit={handleCreateRoadmapSubmit} className="space-y-4 text-sm">
            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Kỹ năng liên kết *</label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newRoadmapForm.skill}
                onChange={e => setNewRoadmapForm({ ...newRoadmapForm, skill: e.target.value })}
              >
                {skillsCatalog.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Vị trí mục tiêu / Chức danh *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ví dụ: Java Backend Developer, React Frontend Engineer..."
                value={newRoadmapForm.targetRole}
                onChange={e => setNewRoadmapForm({ ...newRoadmapForm, targetRole: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Mô tả lộ trình</label>
              <textarea
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
                placeholder="Mô tả tóm tắt về mục tiêu lộ trình..."
                value={newRoadmapForm.description}
                onChange={e => setNewRoadmapForm({ ...newRoadmapForm, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateRoadmapModalOpen(false)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                Tạo và chuyển đến soạn thảo
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Add Topic Modal */}
      {isAddTopicModalOpen && (
        <Modal
          isOpen={isAddTopicModalOpen}
          onClose={() => setIsAddTopicModalOpen(false)}
          title="Thêm Chủ đề học tập mới"
        >
          <form onSubmit={handleAddTopicSubmit} className="space-y-4 text-sm">
            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tiêu đề chủ đề *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ví dụ: Spring Data JPA & Hibernate Fundamentals"
                value={newTopicForm.title}
                onChange={e => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group">
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Thời lượng ước tính</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ví dụ: 5 giờ, 3 ngày..."
                  value={newTopicForm.estimatedTime}
                  onChange={e => setNewTopicForm({ ...newTopicForm, estimatedTime: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Loại tài liệu</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newTopicForm.resourceType}
                  onChange={e => setNewTopicForm({ ...newTopicForm, resourceType: e.target.value })}
                >
                  {resourceTypes.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tên tài liệu / Khóa học</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ví dụ: Spring Framework Official Reference"
                value={newTopicForm.resource}
                onChange={e => setNewTopicForm({ ...newTopicForm, resource: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Đường dẫn liên kết (URL)</label>
              <input
                type="url"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="https://docs.spring.io/..."
                value={newTopicForm.url}
                onChange={e => setNewTopicForm({ ...newTopicForm, url: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddTopicModalOpen(false)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                Thêm chủ đề
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Edit Topic Modal */}
      {editingTopic && (
        <Modal
          isOpen={!!editingTopic}
          onClose={() => setEditingTopic(null)}
          title="Chỉnh sửa Chủ đề học tập"
        >
          <form onSubmit={handleEditTopicSubmit} className="space-y-4 text-sm">
            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tiêu đề chủ đề *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={editTopicForm.title}
                onChange={e => setEditTopicForm({ ...editTopicForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group">
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Thời lượng ước tính</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={editTopicForm.estimatedTime}
                  onChange={e => setEditTopicForm({ ...editTopicForm, estimatedTime: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Loại tài liệu</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={editTopicForm.resourceType}
                  onChange={e => setEditTopicForm({ ...editTopicForm, resourceType: e.target.value })}
                >
                  {resourceTypes.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tên tài liệu / Khóa học</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={editTopicForm.resource}
                onChange={e => setEditTopicForm({ ...editTopicForm, resource: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Đường dẫn liên kết (URL)</label>
              <input
                type="url"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={editTopicForm.url}
                onChange={e => setEditTopicForm({ ...editTopicForm, url: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                Cập nhật chủ đề
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. Delete Roadmap Modal */}
      {deletingRoadmap && (
        <Modal
          isOpen={!!deletingRoadmap}
          onClose={() => setDeletingRoadmap(null)}
          title="Xác nhận xóa Lộ trình"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>
                Hành động này sẽ xóa toàn bộ các module chủ đề liên quan trong lộ trình học tập này.
              </span>
            </div>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa lộ trình <strong className="text-slate-900">{deletingRoadmap.targetRole}</strong> không?
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingRoadmap(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteRoadmapConfirm}
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
