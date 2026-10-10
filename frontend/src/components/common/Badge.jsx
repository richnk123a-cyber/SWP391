import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, ShieldCheck, Sparkles } from 'lucide-react';

export function MatchBadge({ score = 0, label, badgeClass, showIcon = true, size = 'sm' }) {
  const numScore = Number(score) || 0;
  
  let dynamicClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let defaultLabel = 'Chưa so khớp';
  
  if (numScore >= 80) {
    dynamicClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold shadow-2xs';
    defaultLabel = 'High Fit';
  } else if (numScore >= 60) {
    dynamicClass = 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
    defaultLabel = 'Good Match';
  } else if (numScore >= 40) {
    dynamicClass = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    defaultLabel = 'Medium Fit';
  } else {
    dynamicClass = 'bg-slate-50 text-slate-600 border-slate-200';
    defaultLabel = 'Low Fit';
  }

  const finalClass = badgeClass || dynamicClass;
  const finalLabel = label || defaultLabel;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border transition-all ${finalClass}`}>
      {showIcon && (
        numScore >= 60 ? (
          <CheckCircle2 size={12} className="shrink-0" />
        ) : (
          <AlertCircle size={12} className="shrink-0" />
        )
      )}
      <span>{numScore}% {finalLabel}</span>
    </span>
  );
}

export function VerificationBadge({ status }) {
  if (status === 'Verified' || status === true) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
        <ShieldCheck size={12} className="text-blue-600" />
        <span>Đã xác minh</span>
      </span>
    );
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock size={12} className="text-amber-600" />
        <span>Chờ xác minh</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <XCircle size={12} className="text-slate-400" />
      <span>Chưa xác minh</span>
    </span>
  );
}

export function StatusBadge({ status }) {
  switch (status) {
    case 'Đã nộp':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock size={12} /> Đã nộp
        </span>
      );
    case 'Đã xem':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <CheckCircle2 size={12} /> Đã xem
        </span>
      );
    case 'Phỏng vấn':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
          <Sparkles size={12} /> Phỏng vấn
        </span>
      );
    case 'Offer':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <CheckCircle2 size={12} /> Offer
        </span>
      );
    case 'Từ chối':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} /> Từ chối
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status || 'Đang xử lý'}
        </span>
      );
  }
}
