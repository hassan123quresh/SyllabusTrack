import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';

interface ChartProps {
  data: any[];
  isMobile?: boolean;
  isPhone?: boolean;
}

const CustomTooltip = ({ active, payload, label, isPhone }: any) => {
  if (!active || !payload || !Array.isArray(payload) || payload.length === 0) return null;
  
  const dataItem = payload[0]?.payload;
  if (!dataItem) return null;
  
  const total = (dataItem.Completed || 0) + (dataItem.Remaining || 0);
  const percent = total > 0 ? Math.round((dataItem.Completed / total) * 100) : 0;

  return (
    <div className="bg-[#020604] border border-lime-500/20 p-2.5 rounded-xl text-white text-[10px] shadow-2xl z-50 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 mb-2">
         <p className="font-bold text-lime-300 text-xs">{dataItem.name}</p>
         <span className="font-bold bg-lime-500/20 text-lime-300 px-1.5 py-0.5 rounded text-[9px]">{percent}%</span>
      </div>
      <div className="space-y-1">
         <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dataItem.color }}></span>
             <span className="text-slate-300">Done</span>
           </div>
           <span className="font-mono font-bold">{dataItem.Completed}</span>
         </div>
         <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
             <span className="text-slate-500">Left</span>
           </div>
           <span className="font-mono font-bold text-slate-500">{dataItem.Remaining}</span>
         </div>
      </div>
    </div>
  );
};

export const SubjectProgressChart = React.memo(({ data, isMobile, isPhone }: ChartProps) => {
  // Strict check
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No data available</div>;
  }

  return (
    <div className="w-full h-full flex flex-col justify-center gap-4 px-4 py-4 sm:px-0">
      {data.map((entry: any, index: number) => {
        if (!entry) return null;
        const total = (entry.Completed || 0) + (entry.Remaining || 0);
        const percent = total > 0 ? Math.round((entry.Completed / total) * 100) : 0;
        
        return (
          <div key={entry.name || index} className="w-full group" title={`${entry.name}: ${entry.Completed} Done / ${entry.Remaining} Left`}>
            {/* Subject Name Above */}
            <div className="mb-1.5">
               <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide pl-1">{entry.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Progress Bar Container */}
              <div className="flex-1 h-3.5 sm:h-4 bg-[#020604] rounded-full border border-white/10 relative overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                 {/* Liquid Fill */}
                 <div 
                   className="h-full rounded-full relative transition-all duration-1000 ease-out"
                   style={{ 
                     width: `${percent}%`, 
                     background: `linear-gradient(90deg, rgba(140, 197, 51, 0.8) 0%, #8CC533 100%)`, 
                     boxShadow: `0 0 15px rgba(140, 197, 51, 0.4)` 
                   }}
                 >
                   <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50"></div>
                   <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40"></div>
                 </div>
              </div>

              {/* Percentage Text on Right side */}
              <span className="text-xs font-bold text-[#8CC533] min-w-[32px] text-right">
                {percent}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export const PriorityMixChart = React.memo(({ data, isPhone }: ChartProps) => {
  // Guard against undefined or empty data which causes 'indexOf' errors in Recharts
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(item => item && typeof item.value === 'number' && !isNaN(item.value));
  }, [data]);

  if (safeData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={safeData} 
          cx="50%" cy="50%" 
          innerRadius={isPhone ? 50 : 60} 
          outerRadius={isPhone ? 70 : 80} 
          paddingAngle={4} 
          dataKey="value" 
          stroke="none" 
          isAnimationActive={!isPhone}
          animationDuration={800}
        >
          {safeData.map((entry: any, index: number) => (
             <Cell key={`cell-${index}`} fill={entry.color || '#333'} />
          ))}
        </Pie>
        {!isPhone && <Tooltip content={(props) => <CustomTooltip {...props} isPhone={isPhone} />} />}
        <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', opacity: 0.7, color: '#94a3b8' }} verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  );
});