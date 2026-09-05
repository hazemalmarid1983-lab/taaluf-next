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

export default function DomainRadar({ domainAverages }: Props) {
  const data = Object.entries(domainAverages).map(([domain, value]) => ({
    domain: shortRadarDomainLabel(domain),
    fullDomain: domain,
    value: Number(value.toFixed(2)),
  }));

  if (!data.length) {
    return (
      <p className="py-10 text-center text-sm text-white/45">لا بيانات للرسم بعد</p>
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
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 3]}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: '#0f1c24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
            formatter={(value) => [value, 'متوسط المجال']}
            labelFormatter={(_, payload) =>
              String(payload?.[0]?.payload?.fullDomain || '')
            }
          />
          <Radar
            name="متوسط المجال"
            dataKey="value"
            stroke="#14b8a6"
            fill="#14b8a6"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
