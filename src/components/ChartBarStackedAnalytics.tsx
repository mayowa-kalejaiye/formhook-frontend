"use client";
import * as React from "react";
import { Bar, BarChart, XAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export interface AnalyticsBarChartProps {
  data: Array<{
    date: string;
    value1: number;
    value2: number;
    label1: string;
    label2: string;
    color1?: string;
    color2?: string;
  }>;
  title?: string;
  description?: string;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
}

export function ChartBarStackedAnalytics({
  data,
  title = "Stacked Bar Chart",
  description = "",
  label1 = "Value 1",
  label2 = "Value 2",
  color1 = "#6366f1",
  color2 = "#22d3ee",
}: AnalyticsBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <Tooltip
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <Bar
              dataKey="value1"
              name={label1}
              stackId="a"
              fill={color1}
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="value2"
              name={label2}
              stackId="a"
              fill={color2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
