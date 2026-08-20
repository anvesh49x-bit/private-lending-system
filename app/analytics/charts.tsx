/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

function formatCurrency(value: number) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
}

function formatFullCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95">
        <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">{label}</p>
        <div className="flex flex-col gap-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-300 font-medium">{entry.name}</span>
              </div>
              <span className="text-white font-bold tracking-wide">{formatFullCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-6 pt-6">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center gap-2 text-sm font-medium text-zinc-600">
          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

export function MoneyFlowChart({ data }: { data: any[] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#18181b" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e4e4e7" />
          <XAxis 
            dataKey="period" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
            dy={15}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Area type="monotone" name="Capital Lent" dataKey="capitalLent" stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#colorLent)" />
          <Area type="monotone" name="Principal Recovered" dataKey="principalRecovered" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRecovered)" />
          <Area type="monotone" name="Interest Collected" dataKey="interestCollected" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorInterest)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyCollectionsChart({ data }: { data: any[] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barSize={32}>
          <defs>
            <linearGradient id="barRecovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa"/>
              <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
            <linearGradient id="barInterest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80"/>
              <stop offset="100%" stopColor="#22c55e"/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e4e4e7" />
          <XAxis 
            dataKey="period" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
            dy={15}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar name="Principal Recovered" dataKey="principalRecovered" stackId="a" fill="url(#barRecovered)" />
          <Bar name="Interest Collected" dataKey="interestCollected" stackId="a" fill="url(#barInterest)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CapitalRecoveryDonut({ data }: { data: { recovered: number, outstanding: number, recoveryRate: number } }) {
  const chartData = [
    { name: "Recovered", value: data.recovered, color: "#3b82f6" },
    { name: "Outstanding", value: data.outstanding, color: "#f4f4f5" }
  ];

  if (data.recovered === 0 && data.outstanding === 0) return <EmptyChart />;

  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={90}
            outerRadius={120}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Recovery Rate</span>
        <span className="text-4xl font-bold text-zinc-900 mt-1">{data.recoveryRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function PortfolioCompositionDonut({ data }: { data: { principalOutstanding: number, interestReceivable: number, totalOutstanding: number } }) {
  const chartData = [
    { name: "Principal Due", value: data.principalOutstanding, color: "#ef4444" },
    { name: "Interest Due", value: data.interestReceivable, color: "#f59e0b" }
  ];

  if (data.totalOutstanding === 0) return <EmptyChart />;

  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={90}
            outerRadius={120}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Total Outstanding</span>
        <span className="text-3xl font-bold text-zinc-900 mt-1">{formatCurrency(data.totalOutstanding)}</span>
      </div>
    </div>
  );
}

export function InterestGrowthChart({ data }: { data: any[] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barSize={40}>
          <defs>
            <linearGradient id="barGrowth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80"/>
              <stop offset="100%" stopColor="#16a34a"/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e4e4e7" />
          <XAxis 
            dataKey="period" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
            dy={15}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar name="Interest Collected" dataKey="interestCollected" fill="url(#barGrowth)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[300px] w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-200 flex items-center justify-center mb-4 text-zinc-300">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-zinc-600 font-medium">No lending data available</p>
      <p className="text-zinc-400 text-sm mt-1">Check back later when activity occurs.</p>
    </div>
  );
}
