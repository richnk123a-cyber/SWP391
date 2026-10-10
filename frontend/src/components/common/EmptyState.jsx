import React from 'react';
import { Search, FolderOpen, AlertCircle, Sparkles } from 'lucide-react';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Không có dữ liệu',
  description = 'Chưa có thông tin hiển thị tại thời điểm này.',
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  badgeText = null
}) {
  return (
    <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-xs max-w-xl mx-auto my-6 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
        <Icon size={28} className="text-blue-600" />
      </div>

      {badgeText && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-200">
          <Sparkles size={12} /> {badgeText}
        </span>
      )}

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{description}</p>
      </div>

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
