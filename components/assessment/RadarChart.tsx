'use client';

import { shortRadarDomainLabel } from '@/lib/radarLabels';
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
    domain: shortRadarDomainLabel(domain),
    fullDomain: domain,
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
    <div className="h-96 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="55%"
          margin={{ top: 36, right: 72, bottom: 36, left: 72 }}
        >
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: '#334155', fontSize: 12 }}
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
            formatter={(value) => [value, 'النتيجة']}
            labelFormatter={(_, payload) =>
              String(payload?.[0]?.payload?.fullDomain || '')
            }
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
