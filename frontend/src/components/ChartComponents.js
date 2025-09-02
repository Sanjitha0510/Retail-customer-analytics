import React from 'react';
import { 
  BarChart as RechartsBar,
  PieChart as RechartsPie,
  LineChart as RechartsLine,
  Bar,
  Pie,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';

// ChartComponents.js
export const CustomBarChart = ({ data, title }) => (
  <div className="chart-container">
    <h3 className="chart-title">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBar data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          width={60}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#2d2d2d',
            border: '1px solid #4d4d4d',
            borderRadius: '8px',
            padding: '10px'
          }}
          cursor={{ fill: 'rgba(255, 140, 0, 0.1)' }}
        />
        <Bar 
          dataKey="value" 
          fill="#FF8C00"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </RechartsBar>
    </ResponsiveContainer>
  </div>
);

export const CustomPieChart = ({ data, title }) => {
  // Custom color palette with better contrasting orange shades
  const COLORS = [
    'rgba(255, 140, 0, 0.3)',  // Orange
    'rgba(75, 192, 192, 0.3)', // Teal
    'rgba(153, 102, 255, 0.3)', // Purple
    'rgba(255, 99, 132, 0.3)',  // Pink
    'rgba(54, 162, 235, 0.3)',  // Blue
    'rgba(255, 206, 86, 0.3)',   // Yellow
    'rgba(133, 0, 0, 0.3)'
  ];

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={0}
            paddingAngle={0}
            stroke='none'
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            labelLine={{ stroke: '#a0a0a0', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#none"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#2d2d2d',
              border: '1px solid #4d4d4d',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value) => new Intl.NumberFormat().format(value)}
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
};

export const CustomLineChart = ({ data, title }) => (
  <div className="chart-container">
    <h3 className="chart-title">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLine data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          width={60}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#2d2d2d',
            border: '1px solid #4d4d4d',
            borderRadius: '8px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#FF8C00"
          strokeWidth={2}
          dot={{ fill: '#2d2d2d', stroke: '#FF8C00', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#FF8C00' }}
        />
      </RechartsLine>
    </ResponsiveContainer>
  </div>
);

