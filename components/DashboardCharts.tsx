
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

interface ChartProps {
  data: any[];
  isMobile?: boolean;
  isPhone?: boolean;
}

const CustomTooltip = ({ active, payload, label, isPhone }: any) => {
  if (isPhone || !active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#020604] border border-lime-500/20 p-2 rounded text-white text-[10px] shadow-xl">
      <p className="font-bold mb-1 text-lime-300">{label}</p>
      {payload.map((entry: any, index: number) => (
         <div key={index} className="flex items-center gap-1.5">
           <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
           <span>{entry.name}: {entry.value}</span>
         </div>
      ))}
    </div>
  );
};

export const SubjectProgressChart = React.memo(({ data, isMobile, isPhone }: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        layout={isMobile ? 'vertical' : 'horizontal'} 
        data={data} 
        margin={{ top: 0, right: 10, left: isMobile ? -10 : -20, bottom: 0 }} 
        barSize={isMobile ? 20 : 36}
      >
        <CartesianGrid vertical={false} horizontal={false} stroke="rgba(255,255,255,0.05)" />
        {isMobile ? 
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} /> : 
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, dy: 10 }} interval={0} />
        }
        {!isMobile && <YAxis hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />}
        {!isPhone && <Tooltip content={(props) => <CustomTooltip {...props} isPhone={isPhone} />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />}
        <Bar dataKey="Completed" stackId="a" fill="url(#limeGradient)" radius={isMobile ? [0, 0, 0, 0] : [0, 0, 0, 0]} isAnimationActive={!isPhone} animationDuration={isPhone ? 0 : 800} />
        <Bar dataKey="Remaining" stackId="a" fill="rgba(255, 255, 255, 0.08)" radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={!isPhone} animationDuration={isPhone ? 0 : 800} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const PriorityMixChart = React.memo(({ data, isPhone }: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={data} 
          cx="50%" cy="50%" 
          innerRadius={isPhone ? 50 : 60} 
          outerRadius={isPhone ? 70 : 80} 
          paddingAngle={6} 
          dataKey="value" 
          stroke="none" 
          isAnimationActive={!isPhone}
          animationDuration={isPhone ? 0 : 800}
        >
          {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
        </Pie>
        {!isPhone && <Tooltip content={(props) => <CustomTooltip {...props} isPhone={isPhone} />} />}
        <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', opacity: 0.7, color: '#94a3b8' }} verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  );
});
