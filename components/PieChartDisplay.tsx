
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChartDataItem } from '../types.ts';
import { PIE_CHART_COLORS } from '../constants.ts';

interface PieChartDisplayProps {
  data: PieChartDataItem[];
}

export const PieChartDisplay: React.FC<PieChartDisplayProps> = ({ data }) => {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.fill || PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
  }));
  
  // Screen readers get the figures as text; the drawing is hidden from them.
  const summary = chartData.map((d) => `${d.name}: ${d.value}%`).join('; ');
  return (
    <div className="w-full h-72 sm:h-96" role="img" aria-label={summary}>
      <div aria-hidden="true" className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer={false}>
          <Pie
            rootTabIndex={-1}
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};