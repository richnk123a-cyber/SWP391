import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Users,
  Lock,
  Unlock,
  Search,
  UserCheck,
  Eye,
  Calendar,
  Mail,
  AlertCircle,
  X,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';

export function UserManagementPage() {
  const { usersDB, toggleLockUser, showToast, refreshAdminUsers } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [viewingUser, setViewingUser] = useState(null);
  const [lockingUser, setLockingUser] = useState(null);
  const [lockReason, setLockReason] = useState('');

  // Tự động tải danh sách người dùng từ CSDL khi mở trang
  React.useEffect(() => {
    if (typeof refreshAdminUsers === 'function') {
      refreshAdminUsers();
    }
  }, [refreshAdminUsers]);

  // Metrics (an toàn với dữ liệu thực từ CSDL)
  const userList = Array.isArray(usersDB) ? usersDB : [];
  const totalUsersCount = userList.length;
  const candidatesCount = userList.filter(u => u && (u.role === 'CANDIDATE' || u.role === 'ROLE_CANDIDATE')).length;
  const employersCount = userList.filter(u => u && (u.role === 'EMPLOYER' || u.role === 'ROLE_EMPLOYER')).length;
  const lockedUsersCount = userList.filter(u => u && u.status === 'LOCKED').length;

  // Filtered List
  const filteredUsers = userList.filter(u => {
    if (!u) return false;
    const q = searchQuery.toLowerCase().trim();
    const emailStr = (u.email || '').toLowerCase();
    const userStr = (u.username || '').toLowerCase();
    const nameStr = (u.fullName || '').toLowerCase();
    const matchesSearch =
      !q ||
      emailStr.includes(q) ||
      userStr.includes(q) ||
      nameStr.includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter || u.role === `ROLE_${roleFilter}`;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleConfirmLock = (e) => {
    e.preventDefault();
    if (!lockingUser) return;
    if (!lockReason.trim()) {
      showToast('Vui lòng nhập lý do khóa tài khoản.', 'danger');
      return;
    }
    toggleLockUser(lockingUser.id, lockReason);
    setLockingUser(null);
    setLockReason('');
    if (viewingUser && viewingUser.id === lockingUser.id) {
      setViewingUser(null);
    }
  };

  const handleQuickUnlock = (userId) => {
    toggleLockUser(userId, '');
    if (viewingUser && viewingUser.id === userId) {
      setViewingUser(null);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Giám sát danh sách tài khoản hệ thống, phân quyền vai trò và quản lý trạng thái khóa/mở khóa tài khoản.
          </p>
        </div>
        <button
          onClick={async () => {
            setIsRefreshing(true);
            await refreshAdminUsers();
            setIsRefreshing(false);
            showToast('Đã đồng bộ danh sách người dùng từ cơ sở dữ liệu!', 'success');
          }}
          disabled={isRefreshing}
          className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg flex items-center gap-2 border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0 disabled:opacity-60"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Đang đồng bộ...' : 'Đồng bộ từ CSDL'}
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div
          onClick={() => {
            setRoleFilter('ALL');
            setStatusFilter('ALL');
          }}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            roleFilter === 'ALL' && statusFilter === 'ALL'
              ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/20'
              : 'border-slate-200/90 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng tài khoản
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{totalUsersCount}</p>
        </div>

        <div
          onClick={() => setRoleFilter('CANDIDATE')}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            roleFilter === 'CANDIDATE'
              ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20'
              : 'border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ứng viên (Candidates)
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{candidatesCount}</p>
        </div>

        <div
          onClick={() => setRoleFilter('EMPLOYER')}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            roleFilter === 'EMPLOYER'
              ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/20'
              : 'border-slate-200/90 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Nhà tuyển dụng (Employers)
            </span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{employersCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('LOCKED')}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            statusFilter === 'LOCKED'
              ? 'border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/20'
              : 'border-slate-200/90 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tài khoản bị khóa
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Lock size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{lockedUsersCount}</p>
        </div>
      </div>

      {/* 3. Search & Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="Tìm theo email, tên đăng nhập hoặc họ tên..."
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

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="CANDIDATE">Ứng viên (CANDIDATE)</option>
            <option value="EMPLOYER">Nhà tuyển dụng (EMPLOYER)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="LOCKED">Đã bị khóa (LOCKED)</option>
          </select>
        </div>
      </div>

      {/* 4. Enterprise Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Email tài khoản</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {filteredUsers.map(u => {
                const isLocked = u.status === 'LOCKED';
                const isAdmin = u.role === 'ADMIN';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {((u.fullName || u.username || u.email || "U").charAt(0)).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName || u.username}</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {isAdmin && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          ADMIN
                        </span>
                      )}
                      {u.role === 'EMPLOYER' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                          EMPLOYER
                        </span>
                      )}
                      {u.role === 'CANDIDATE' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          CANDIDATE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">{u.createdAt || '01/09/2026'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isLocked ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                          <Lock size={13} /> Đã khóa
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <UserCheck size={13} /> Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
                          title="Xem thông tin chi tiết"
                        >
                          <Eye size={13} className="mr-1 inline" /> Chi tiết
                        </button>
                        {!isAdmin && (
                          isLocked ? (
                            <button
                              onClick={() => handleQuickUnlock(u.id)}
                              className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-emerald-700 cursor-pointer"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock size={13} className="mr-1 inline" /> Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => setLockingUser(u)}
                              className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                              title="Khóa tài khoản nếu vi phạm"
                            >
                              <Lock size={13} className="mr-1 inline" /> Khóa
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. User Detail Modal */}
      {viewingUser && (
        <Modal
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title={`Hồ sơ tài khoản: ${viewingUser.username}`}
        >
          <div className="space-y-5 text-sm">
            {/* User header box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">
                  {((viewingUser.fullName || viewingUser.username || viewingUser.email || "U").charAt(0)).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingUser.fullName || viewingUser.username}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{viewingUser.id}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                viewingUser.status === 'LOCKED'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {viewingUser.status === 'LOCKED' ? 'Đã bị khóa' : 'Đang hoạt động'}
              </span>
            </div>

            {/* Account Information grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email tài khoản</label>
                <p className="font-semibold text-slate-900 mt-1">{viewingUser.email}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Vai trò trong hệ thống</label>
                <p className="font-semibold text-slate-900 mt-1">{viewingUser.role}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ngày tạo tài khoản</label>
                <p className="font-semibold text-slate-800 mt-1">{viewingUser.createdAt || '01/09/2026'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Phương thức xác thực</label>
                <p className="font-semibold text-slate-800 mt-1">{viewingUser.authProvider || 'LOCAL / Google OAuth'}</p>
              </div>
            </div>

            {/* Lock reason if locked */}
            {viewingUser.lockReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                <p className="font-bold">Lý do khóa tài khoản:</p>
                <p>{viewingUser.lockReason}</p>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              {viewingUser.role !== 'ADMIN' && (
                viewingUser.status === 'LOCKED' ? (
                  <button
                    type="button"
                    onClick={() => handleQuickUnlock(viewingUser.id)}
                    className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
                  >
                    <Unlock size={15} className="mr-1.5 inline" /> Mở khóa tài khoản
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLockingUser(viewingUser)}
                    className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
                  >
                    <Lock size={15} className="mr-1.5 inline" /> Khóa tài khoản
                  </button>
                )
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Lock Account Confirmation Modal */}
      {lockingUser && (
        <Modal
          isOpen={!!lockingUser}
          onClose={() => setLockingUser(null)}
          title={`Khóa tài khoản: ${lockingUser.username}`}
        >
          <form onSubmit={handleConfirmLock} className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>
                Khi bị khóa, người dùng này sẽ không thể đăng nhập hoặc thực hiện bất kỳ thao tác nào trên hệ thống CareerFit.
              </span>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Lý do khóa tài khoản *</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Ví dụ: Đăng tin giả mạo lừa đảo, vi phạm điều khoản ứng tuyển, spam hệ thống..."
                value={lockReason}
                onChange={e => setLockReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLockingUser(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Xác nhận khóa
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
