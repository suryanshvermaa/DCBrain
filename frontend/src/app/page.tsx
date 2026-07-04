'use client';

import React from 'react';
import { LayoutDashboard, FileText, Search, Bot, AlertTriangle, Package, Settings, Users, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: true },
  { name: 'Documents', href: '/documents', icon: FileText, current: false },
  { name: 'Search', href: '/search', icon: Search, current: false },
  { name: 'Chat', href: '/chat', icon: Bot, current: false },
  { name: 'Compliance', href: '/compliance', icon: AlertTriangle, current: false },
  { name: 'Schedule', href: '/schedule', icon: LayoutDashboard, current: false },
  { name: 'Procurement', href: '/procurement', icon: Package, current: false },
  { name: 'Agents', href: '/agents', icon: Bot, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
];

const stats = [
  { label: 'Active Projects', value: '12', change: '+2', trend: 'up' },
  { label: 'Documents Processed', value: '1,247', change: '+45', trend: 'up' },
  { label: 'Compliance Issues', value: '8', change: '-3', trend: 'down' },
  { label: 'Schedule Risks', value: '23', change: '+5', trend: 'up' },
];

const recentActivity = [
  { type: 'document', title: 'Structural Drawings - Rev 3', project: 'DC-2024-001', time: '2 hours ago', status: 'processed' },
  { type: 'compliance', title: 'ASHRAE 90.1 Check', project: 'DC-2024-003', time: '4 hours ago', status: 'warning' },
  { type: 'schedule', title: 'Delay Risk Detected', project: 'DC-2024-002', time: '6 hours ago', status: 'critical' },
  { type: 'procurement', title: 'PO #PR-2024-045 Created', project: 'DC-2024-001', time: '8 hours ago', status: 'success' },
  { type: 'agent', title: 'Schedule Risk Agent Completed', project: 'DC-2024-004', time: '1 day ago', status: 'success' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </span>
              DCBrain
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI Platform for Data Centre EPC</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/help"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Help & Docs
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                All systems operational
              </div>
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-6 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.status === 'success'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : activity.status === 'warning'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : activity.status === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {activity.type === 'document' && <FileText className="w-5 h-5" />}
                      {activity.type === 'compliance' && <AlertTriangle className="w-5 h-5" />}
                      {activity.type === 'schedule' && <LayoutDashboard className="w-5 h-5" />}
                      {activity.type === 'procurement' && <Package className="w-5 h-5" />}
                      {activity.type === 'agent' && <Bot className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          activity.status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : activity.status === 'warning'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : activity.status === 'critical'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}