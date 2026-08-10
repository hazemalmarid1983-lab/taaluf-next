'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type Props = {
  domainAverages: Record<string, number>;
};

export default function AssessmentRadarChart({ domainAverages }: Props) {
  const data = Object.entries(domainAverages).map(([domain, value]) => ({
    domain,
    score: Number(value.toFixed(2)),
  }));

  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        اضغط «حساب النتيجة» لعرض الرسم الشعاعي
      </p>
    );
  }

  return (
    <div className="h-80 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: '#475569', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 3]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              color: '#0f172a',
            }}
          />
          <Radar
            name="النتيجة"
            dataKey="score"
            stroke="#2D8B5A"
            fill="#2D8B5A"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
