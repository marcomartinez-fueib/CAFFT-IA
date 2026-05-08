
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EvolutionChartDataPoint, QpviiLineConfig } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface QpviiEvolutionChartProps {
  data: EvolutionChartDataPoint[];
  lines: QpviiLineConfig[];
  // title prop is removed as it's typically handled by SectionCard
}

export const QpviiEvolutionChart: React.FC<QpviiEvolutionChartProps> = ({ data, lines }) => {
  const { t } = useLanguage();

  if (data.length < 1) {
    return <p className="text-center text-gray-500 py-10">{t('evolution.noHistoryForChart', { count: 1 })}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30, // Increased right margin for better legend visibility if it overflows
          left: 0, 
          bottom: 25, // Increased bottom margin for angled labels
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="dateLabel"
          stroke="#555"
          tick={{ fontSize: 10 }}
          angle={-40} // Angle ticks for better readability
          textAnchor="end"
          height={60} // Adjust height to accommodate angled labels
          interval="preserveStartEnd" 
        />
        <YAxis
          stroke="#555"
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          allowDataOverflow={false} // Prevent Y-axis from extending too far beyond data
          label={{ value: t('evolution.scoreAxisLabel'), angle: -90, position: 'insideLeft', style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '4px', borderColor: '#ccc', padding: '8px 12px' }}
          labelStyle={{ color: '#333', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name} // Name for the legend
            stroke={line.color}
            strokeWidth={2.5}
            activeDot={{ r: 7, strokeWidth: 1, fill: line.color, stroke: '#fff' }}
            dot={{ r: 4, strokeWidth: 0, fill: line.color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
