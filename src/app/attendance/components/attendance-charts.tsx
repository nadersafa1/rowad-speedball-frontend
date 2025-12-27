/**
 * Attendance Charts
 * Visualizations for attendance data
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { AttendanceStats } from './attendance-stats-cards'

interface AttendanceChartsProps {
  stats: AttendanceStats
  monthlyData?: Array<{
    month: string
    present: number
    absent: number
    excused: number
  }>
  isLoading?: boolean
}

const STATUS_COLORS = {
  present: '#10b981', // green
  absent: '#ef4444', // red
  excused: '#f59e0b', // yellow
  pending: '#6b7280', // gray
}

export function AttendanceCharts({
  stats,
  monthlyData = [],
  isLoading = false,
}: AttendanceChartsProps) {
  // Prepare pie chart data
  const pieData = [
    { name: 'Present', value: stats.present, color: STATUS_COLORS.present },
    { name: 'Absent', value: stats.absent, color: STATUS_COLORS.absent },
    { name: 'Excused', value: stats.excused, color: STATUS_COLORS.excused },
    { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
  ].filter((item) => item.value > 0)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pie Chart - Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No attendance data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart - Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No monthly data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="present"
                  fill={STATUS_COLORS.present}
                  name="Present"
                />
                <Bar
                  dataKey="excused"
                  fill={STATUS_COLORS.excused}
                  name="Excused"
                />
                <Bar dataKey="absent" fill={STATUS_COLORS.absent} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
