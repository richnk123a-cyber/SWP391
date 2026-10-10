import React from 'react';
import { Cpu } from 'lucide-react';

export function AISkeletonLoading() {
  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
        <Cpu size={32} className="animate-spin" />
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-800">Đang phân tích CV và yêu cầu công việc...</h4>
        <p className="text-xs text-slate-500 mt-1">Hệ thống AI đang so khớp kinh nghiệm, kỹ năng cốt lõi và tiêu chí từ JD</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <div className="h-4 skeleton w-full"></div>
        <div className="h-4 skeleton w-5/6 mx-auto"></div>
        <div className="h-4 skeleton w-4/6 mx-auto"></div>
      </div>
    </div>
  );
}
