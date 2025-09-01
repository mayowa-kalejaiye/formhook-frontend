"use client";
import React from "react";
import { Card } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
// import { ScrollArea } from "../../components/ui/scroll-area";
import { AreaChart, BarChart, XAxis, YAxis, Tooltip as RechartsTooltip, Area, Bar, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// Dummy data for illustration
const areaData = [
  { date: "Mon", submissions: 12 },
  { date: "Tue", submissions: 18 },
  { date: "Wed", submissions: 9 },
  { date: "Thu", submissions: 22 },
  { date: "Fri", submissions: 15 },
  { date: "Sat", submissions: 7 },
  { date: "Sun", submissions: 14 },
];
const barData = [
  { form: "Contact", submissions: 32 },
  { form: "Signup", submissions: 18 },
  { form: "Survey", submissions: 12 },
  { form: "Feedback", submissions: 7 },
];

export default function DashboardCharts() {
  const [range, setRange] = React.useState("7d");
  return (
    <Card className="w-full mt-10 p-6 bg-gradient-to-br from-[#0f172a]/90 to-[#0014FF]/70 dark:bg-[#0f172a] rounded-2xl shadow-xl border-0 relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 z-10">
        <h2 className="text-xl font-bold text-white mb-4 md:mb-0">Analytics</h2>
        <Tabs value={range} onValueChange={setRange} className="">
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="Q1">Q1</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="w-full max-w-3xl mx-auto overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Area Chart */}
          <div className="bg-[#0f172a]/80 rounded-xl p-4 shadow-lg">
            <h3 className="text-white text-lg font-semibold mb-2">Submissions per Day</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6EE7B7"/>
                <YAxis stroke="#6EE7B7"/>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                <RechartsTooltip contentStyle={{ background: "#0f172a", border: "none", color: "#fff" }} />
                <Area type="monotone" dataKey="submissions" stroke="#6EE7B7" fillOpacity={1} fill="url(#colorSub)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Bar Chart */}
          <div className="bg-[#0f172a]/80 rounded-xl p-4 shadow-lg">
            <h3 className="text-white text-lg font-semibold mb-2">Submissions per Form</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                <XAxis dataKey="form" stroke="#6EE7B7"/>
                <YAxis stroke="#6EE7B7"/>
                <RechartsTooltip contentStyle={{ background: "#0f172a", border: "none", color: "#fff" }} />
                <Legend />
                <Bar dataKey="submissions" fill="#6EE7B7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
