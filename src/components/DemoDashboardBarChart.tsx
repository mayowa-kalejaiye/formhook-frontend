import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function DemoDashboardBarChart({ data, title, label1, label2, color1, color2 }) {
  return (
    <Card className="w-full h-64 bg-white/80 dark:bg-black/80 border border-blue-100 shadow mb-8">
      <CardHeader>
        <CardTitle className="text-purple-700 dark:text-purple-200 text-lg">{title}</CardTitle>
        <CardDescription>
          {label1} vs {label2}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-40 flex items-end">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: color1 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: color2 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: color1 + '22' }} contentStyle={{ background: '#fff', borderRadius: 8, border: `1px solid ${color1}` }} />
            <Bar dataKey="value1" fill={color1} radius={[6, 6, 0, 0]} />
            <Bar dataKey="value2" fill={color2} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
