
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
        margin={{ top: 0, right: 10, left: isMobile ? 0 : -20, bottom: 0 }} 
        barSize={isMobile ? 22 : 36}
      >
        <CartesianGrid vertical={false} horizontal={false} stroke="rgba(255,255,255,0.05)" />
        {isMobile ? 
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            width={110} 
            interval={0}
            // Align text to the very left (start) with 10px padding (dx) for visual separation
            tick={{ fontSize: 11, fill: '#e2e8f0', fontWeight: 600, textAnchor: 'start', x: 0, dx: 10 }} 
          /> : 
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, dy: 10 }} interval={0} />
        }
        {!isMobile && <YAxis hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />}
        {!isPhone && <Tooltip content={(props) => <CustomTooltip {...props} isPhone={isPhone} />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />}
        
        {/* Radius configuration for pill shape: [TopLeft, TopRight, BottomRight, BottomLeft] */}
        <Bar 
          dataKey="Completed" 
          stackId="a" 
          fill={isPhone ? "url(#limeGradientMobile)" : "url(#limeGradient)"} 
          radius={isMobile ? [4, 0, 0, 4] : [0, 0, 0, 0]} 
          isAnimationActive={!isPhone} 
          animationDuration={isPhone ? 0 : 800} 
        />
        <Bar 
          dataKey="Remaining" 
          stackId="a" 
          fill="rgba(255, 255, 255, 0.08)" 
          radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]} 
          isAnimationActive={!isPhone} 
          animationDuration={isPhone ? 0 : 800} 
        />
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
    