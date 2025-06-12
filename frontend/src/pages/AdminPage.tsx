import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Database, Settings, List as ListIcon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/layout/Layout'
import Toast from '../components/ui/Toast'   // 🔥 Ajouté ici
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line
} from 'recharts'

const COLORS = ['#2dd4bf', '#7dd3fc', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#fb7185']
const weekDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Annotation {
  createdAt: string
  created_by: string
  type: string
  imageId: string
}
interface User {
  id: string
  name: string
  email: string
  role: string
}
interface Image {
  id: string
  patientName?: string
  patientId?: string
  uploadedAt: string
  uploadedBy?: string
}
interface LogEntry {
  id: string
  action: string
  entity: string
  entity_id: string
  user?: string
  details?: any
  created_at: string
}

const API = 'http://localhost:8000'

const AdminPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [users, setUsers] = useState<User[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [timeData, setTimeData] = useState<any[]>([])
  const [activityHeatmap, setActivityHeatmap] = useState<number[][]>([])
  const [topAnnotators, setTopAnnotators] = useState<any[]>([])
  const [meanDelay, setMeanDelay] = useState<number | null>(null)
  const [anomalyStats, setAnomalyStats] = useState<any[]>([])
  const [showUsers, setShowUsers] = useState(false)
  const [showImages, setShowImages] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // 🔥 Toast + polling states
  const [lastLogId, setLastLogId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return navigate('/login')
    if (user?.role !== 'admin') return navigate('/dashboard')

    fetch(`${API}/api/users`).then(r => r.json()).then(setUsers)
    fetch(`${API}/api/images`).then(r => r.json()).then(setImages)
    fetch(`${API}/api/annotations`)
      .then(async r => {
        let data
        try {
          data = await r.json()
        } catch (e) {
          data = []
        }
        if (Array.isArray(data)) {
          setAnnotations(data)
        } else {
          setAnnotations([])
          console.error('API /api/annotations did not return an array:', data)
        }
      })
      .catch(e => {
        setAnnotations([])
        console.error('Erreur de récupération des annotations:', e)
      })
  }, [isAuthenticated, user, navigate])

  // 🔥 Poll logs for toast notifications
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") return;
    let timeout: any = null;
    let running = true;

    async function pollLogs() {
      try {
        const res = await fetch(`${API}/api/logs?limit=1`);
        const logs = await res.json();
        if (logs.length > 0 && logs[0].id !== lastLogId) {
          if (lastLogId !== null) { // pas la toute première fois
            setToastMsg(
              `Nouvel événement: [${logs[0].action}] sur [${logs[0].entity}] par ${logs[0].user || '—'}`
            );
          }
          setLastLogId(logs[0].id);
        }
      } catch (e) { /* ignore erreur réseau */ }
      if (running) timeout = setTimeout(pollLogs, 10000); // 10 sec
    }
    pollLogs();
    return () => { running = false; if (timeout) clearTimeout(timeout); }
  }, [isAuthenticated, user, lastLogId]);

  // Analytics
  useEffect(() => {
    if (annotations.length === 0 || images.length === 0) return

    // Heatmap
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0))
    annotations.forEach(a => {
      const date = new Date(a.createdAt)
      const day = date.getDay()
      const hour = date.getHours()
      heatmap[day][hour] += 1
    })
    setActivityHeatmap(heatmap)

    // Top Annotators
    const counts: Record<string, number> = {}
    annotations.forEach(a => {
      counts[a.created_by] = (counts[a.created_by] || 0) + 1
    })
    const annotatorStats = Object.entries(counts)
      .map(([email, value]) => ({
        name: users.find(u => u.email === email)?.name || email || '—',
        value
      }))
      .sort((a, b) => b.value - a.value)
    setTopAnnotators(annotatorStats)

    // Mean delay (upload → annotation)
    let totalDelay = 0, countDelay = 0
    const imageUploadMap: Record<string, Date> = {}
    images.forEach(img => { imageUploadMap[img.id] = new Date(img.uploadedAt) })
    const firstAnnByImg: Record<string, Date> = {}
    annotations.forEach(a => {
      if (!firstAnnByImg[a.imageId] || new Date(a.createdAt) < firstAnnByImg[a.imageId]) {
        firstAnnByImg[a.imageId] = new Date(a.createdAt)
      }
    })
    Object.entries(firstAnnByImg).forEach(([imgId, annDate]) => {
      const imgDate = imageUploadMap[imgId]
      if (imgDate) {
        totalDelay += (annDate.getTime() - imgDate.getTime())
        countDelay++
      }
    })
    setMeanDelay(countDelay ? totalDelay / countDelay / 1000 / 60 : null)

    // Anomaly stats
    const typeCounts: Record<string, number> = {}
    annotations.forEach(a => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1
    })
    setAnomalyStats(Object.entries(typeCounts).map(([name, value]) => ({ name, value })))

    // Annotations over time
    const byDate: Record<string, number> = {}
    annotations.forEach(a => {
      const d = new Date(a.createdAt).toLocaleDateString()
      byDate[d] = (byDate[d] || 0) + 1
    })
    const sorted = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setTimeData(sorted)
  }, [annotations, images, users])

  // Load logs when opening panel
  const handleShowLogs = () => {
    setShowLogs(!showLogs)
    setShowUsers(false)
    setShowImages(false)
    if (!showLogs) {
      setLogsLoading(true)
      fetch(`${API}/api/logs?limit=100`)
        .then(r => r.json())
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLogsLoading(false))
    }
  }

  // Delete user
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return
    await fetch(`${API}/api/users/${id}`, { method: 'DELETE' })
    setUsers(users => users.filter(u => u.id !== id))
  }
  // Delete image
  const handleDeleteImage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return
    await fetch(`${API}/api/images/${id}`, { method: 'DELETE' })
    setImages(images => images.filter(i => i.id !== id))
  }

  // Export activity logs as Excel
  const handleExportLogsExcel = () => {
    window.open(`${API}/api/export/excel`, '_blank')
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Manage system settings, users & data</p>
      </div>

      {/* Cards/Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div
          className={`bg-white p-6 rounded-2xl shadow hover:shadow-lg flex items-center cursor-pointer transition border ${showUsers ? 'border-blue-400 ring-2 ring-blue-200' : ''}`}
          onClick={() => { setShowUsers(!showUsers); setShowImages(false); setShowLogs(false) }}
        >
          <div className="bg-blue-50 p-3 rounded-xl mr-4"><Users className="h-7 w-7 text-blue-600" /></div>
          <div>
            <div className="font-semibold text-lg text-gray-900 mb-1">User Management</div>
            <div className="text-gray-500 text-sm">Doctors & Admins</div>
          </div>
        </div>
        <div
          className={`bg-white p-6 rounded-2xl shadow hover:shadow-lg flex items-center cursor-pointer transition border ${showImages ? 'border-blue-400 ring-2 ring-blue-200' : ''}`}
          onClick={() => { setShowImages(!showImages); setShowUsers(false); setShowLogs(false) }}
        >
          <div className="bg-blue-50 p-3 rounded-xl mr-4"><Database className="h-7 w-7 text-blue-600" /></div>
          <div>
            <div className="font-semibold text-lg text-gray-900 mb-1">Data Management</div>
            <div className="text-gray-500 text-sm">Patients & Retinal Images</div>
          </div>
        </div>
        <div
          className={`bg-white p-6 rounded-2xl shadow hover:shadow-lg flex items-center cursor-pointer transition border ${showLogs ? 'border-blue-400 ring-2 ring-blue-200' : ''}`}
          onClick={handleShowLogs}
        >
          <div className="bg-blue-50 p-3 rounded-xl mr-4"><ListIcon className="h-7 w-7 text-blue-600" /></div>
          <div>
            <div className="font-semibold text-lg text-gray-900 mb-1">Activity Logs</div>
            <div className="text-gray-500 text-sm">All system events</div>
          </div>
        </div>
      </div>

      {/* Table Users */}
      {showUsers && (
        <div className="bg-white p-6 rounded-xl shadow border mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">All Users</h2>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setShowUsers(false)}>Close</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Email</th>
                <th className="py-2 text-left">Role</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="py-1">{u.name}</td>
                  <td className="py-1">{u.email}</td>
                  <td className="py-1">{u.role}</td>
                  <td className="py-1">
                    <button className="text-red-600 hover:underline" onClick={() => handleDeleteUser(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Images */}
      {showImages && (
        <div className="bg-white p-6 rounded-xl shadow border mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">All Images</h2>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setShowImages(false)}>Close</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Patient Name</th>
                <th className="py-2 text-left">Patient ID</th>
                <th className="py-2 text-left">Upload Date</th>
                <th className="py-2 text-left">Uploaded By</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {images.map(img => (
                <tr key={img.id} className="border-b hover:bg-gray-50">
                  <td className="py-1">{img.patientName || img.id}</td>
                  <td className="py-1">{img.patientId || '-'}</td>
                  <td className="py-1">{new Date(img.uploadedAt).toLocaleDateString()}</td>
                  <td className="py-1">{img.uploadedBy || '—'}</td>
                  <td className="py-1">
                    <button className="text-red-600 hover:underline" onClick={() => handleDeleteImage(img.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Table */}
      {showLogs && (
        <div className="bg-white p-6 rounded-xl shadow border mb-8 max-h-[520px] overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">Activity Logs (latest 100)</h2>
            <div className="space-x-2">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={handleExportLogsExcel}
              >
                Download Excel
              </button>
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setShowLogs(false)}
              >
                Close
              </button>
            </div>
          </div>
          {logsLoading ? (
            <div className="py-8 text-center text-gray-500">Loading logs…</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-1 text-left">Date</th>
                  <th className="py-1 text-left">Action</th>
                  <th className="py-1 text-left">Entity</th>
                  <th className="py-1 text-left">Entity ID</th>
                  <th className="py-1 text-left">User</th>
                  <th className="py-1 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-1">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-1">{log.action}</td>
                    <td className="py-1">{log.entity}</td>
                    <td className="py-1">{log.entity_id.slice(-6)}</td>
                    <td className="py-1">{log.user || '—'}</td>
                    <td className="py-1">{log.details ? JSON.stringify(log.details) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ----------- Analytics Section ----------- */}
      <div className="text-xl font-semibold mb-3 text-gray-800">Analytics</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Annotators */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-base font-medium mb-2 text-gray-900">Top Annotators</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RBarChart data={topAnnotators.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
        {/* Most Annotated Anomalies */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-base font-medium mb-2 text-gray-900">Most Annotated Anomalies</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={anomalyStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {anomalyStats.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Delay KPI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <h3 className="text-base font-medium mb-2 text-gray-900">⏱️ Mean Time to First Annotation</h3>
          <span className="text-3xl font-bold text-blue-600 mb-1">
            {meanDelay !== null ? `${meanDelay.toFixed(1)} min` : "N/A"}
          </span>
          <span className="text-gray-500 text-xs">Upload ➜ 1st Annotation</span>
        </div>
      </div>
      {/* Heatmap & Annotations over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-medium mb-2 text-gray-900">Activity Heatmap (days × hours)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-max text-xs">
              <thead>
                <tr>
                  <th></th>
                  {Array.from({ length: 24 }).map((_, hour) =>
                    <th key={hour} className="text-center px-1">{hour}h</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {activityHeatmap.map((row, day) => (
                  <tr key={day}>
                    <td className="font-bold pr-2">{weekDay[day]}</td>
                    {row.map((val, hour) => (
                      <td key={hour}
                        style={{
                          background: val === 0 ? '#f3f4f6' : `rgba(52,211,153,${0.2 + Math.min(val / 10, 0.8)})`,
                          minWidth: 18, height: 20, textAlign: 'center',
                        }}>
                        {val || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-medium mb-2 text-gray-900">Annotations Over Time</h3>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#2dd4bf" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔥 Toast notification */}
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}

    </Layout>
  )
}

export default AdminPage
