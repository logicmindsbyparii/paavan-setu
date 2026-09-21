import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';

export default function ResponsiveRadarChart({ categories, maxScore }) {
  const data = (categories || []).map(([name, score]) => ({
    subject: name.length > 16 ? name.slice(0, 14) + '…' : name,
    fullName: name,
    A: score,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart
        data={data}
        cx="50%"
        cy="50%"
        outerRadius="80%"
        innerRadius="55%"
        padding={0}
        startAngle={60}
        endAngle={-240}
      >
        <PolarGrid
          stroke="rgba(17,29,17,0.14)"
          strokeDasharray="3 3"
          poleColor="rgba(17,29,17,0.1)"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'rgba(17,29,17,0.75)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(17,29,17,0.15)' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, Math.max(10, maxScore)]}
          tick={{ fill: 'rgba(17,29,17,0.35)', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
          tickCount={5}
          axisLine={{ stroke: 'rgba(17,29,17,0.1)' }}
        />
        {/* One polygon, not one per category. The previous version mapped a
            <Radar> for every axis — all sharing dataKey="A" over the same data —
            so it drew N identical overlapping shapes and a legend that repeated
            every category name. A radar plots a single multi-axis series; the
            labels on the axes already say which category is which. */}
        <Radar
          name="Score"
          dataKey="A"
          stroke="#b8892e"
          fill="#34d399"
          fillOpacity={0.25}
          strokeWidth={2}
          animationDuration={800}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            border: '1px solid rgba(217,174,60,0.45)',
            borderRadius: 10,
            color: '#111d11',
            boxShadow: '0 12px 30px -12px rgba(17,29,17,0.25)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#8a6a1f', fontWeight: 700, marginBottom: 4 }}
          formatter={(value, name, props) => [`${value} pts`, name]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
