import { useEffect, useState } from 'react'
import { socket } from '../services/socket'

const sortBySeverity = (arr) => [...arr].sort((a, b) => b.riskScore - a.riskScore)

const getBorderColor = (level) =>
  ({
    CRITICAL: 'border-red-600',
    HIGH: 'border-yellow-500',
    MODERATE: 'border-green-500',
  }[level] || 'border-gray-700')

const getBadgeColor = (level) =>
  ({
    CRITICAL: 'bg-red-600',
    HIGH: 'bg-yellow-500',
    MODERATE: 'bg-green-600',
  }[level] || 'bg-gray-600')

const formatDuration = (startTime) => {
  const diff = Math.floor((Date.now() - new Date(startTime)) / 1000)
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${m}m ${s}s`
}

const formatContext = (ctx) =>
  ({
    physical_attack: '🚨 Physical Attack',
    forced_vehicle: '🚗 Forced Into Vehicle',
    medical: '🏥 Medical Emergency',
    unsafe: '⚠️ Unsafe Situation',
    unsure: '❓ Unsure',
  }[ctx] || ctx)

function PCRDashboard() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    let mounted = true

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sos/active`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) {
          setSessions(sortBySeverity(data || []))
          console.log('[PCR] Loaded active sessions:', data?.length ?? 0)
        }
      })
      .catch((err) => console.error('[PCR] Error loading active sessions:', err))

    socket.on('new_sos', (session) => {
      console.log('[PCR] new_sos', session.sessionId)
      setSessions((prev) => sortBySeverity([...(prev || []), session]))
    })

    socket.on('session_update', (updated) => {
      console.log('[PCR] session_update', updated.sessionId)
      setSessions((prev) =>
        sortBySeverity((prev || []).map((s) => (s.sessionId === updated.sessionId ? updated : s))),
      )
    })

    socket.on('tamper_alert', ({ sessionId, riskScore, riskLevel }) => {
      console.log('[PCR] tamper_alert', sessionId)
      setSessions((prev) =>
        sortBySeverity(
          (prev || []).map((s) =>
            s.sessionId === sessionId
              ? { ...s, tamperDetected: true, riskScore, riskLevel }
              : s,
          ),
        ),
      )
    })

    socket.on('session_resolved', ({ sessionId }) => {
      console.log('[PCR] session_resolved', sessionId)
      setSessions((prev) => (prev || []).filter((s) => s.sessionId !== sessionId))
    })

    return () => {
      mounted = false
      socket.off('new_sos')
      socket.off('session_update')
      socket.off('tamper_alert')
      socket.off('session_resolved')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <header>
        <h1 className="text-3xl font-bold text-white">PCR — Police Control Room</h1>
        <p className="text-gray-400 mt-1">Live Emergency Monitoring</p>
        <div className="mt-2 text-sm text-gray-500">Active Sessions: {sessions.length}</div>
      </header>

      {sessions.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh] text-gray-500 text-lg">
          No active emergencies
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sessions.map((session) => {
            const lastLoc =
              session.locations && session.locations.length > 0
                ? session.locations[session.locations.length - 1]
                : null

            return (
              <div
                key={session.sessionId}
                className={`bg-gray-900 rounded-xl p-5 border-l-4 ${getBorderColor(
                  session.riskLevel,
                )}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl font-bold truncate">
                    {session.victimName || 'Unknown Victim'}
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full text-white ${getBadgeColor(
                      session.riskLevel,
                    )} ${
                      session.riskLevel === 'CRITICAL'
                        ? 'animate-pulse'
                        : ''
                    }`}
                  >
                    {session.riskLevel || 'MODERATE'}
                  </span>
                </div>

                <div className="mt-2 text-gray-300 text-sm">
                  {formatContext(session.contextType)}
                </div>

                <div className="mt-3">
                  <div className="text-sm text-gray-400">Risk Score:</div>
                  <div
                    className={`text-2xl font-extrabold ${
                      session.riskLevel === 'CRITICAL'
                        ? 'text-red-500'
                        : session.riskLevel === 'HIGH'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {session.riskScore ?? 0} / 100
                  </div>
                </div>

                <div className="mt-1 text-gray-400 text-sm">
                  Duration: {formatDuration(session.startTime)}
                </div>

                {session.tamperDetected && (
                  <div className="bg-red-900 border border-red-600 rounded-lg p-2 mt-3 text-red-300 text-sm font-semibold">
                    ⚠️ TAMPER DETECTED — Device went offline
                  </div>
                )}

                {lastLoc && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last location: {lastLoc.lat?.toFixed(5)}, {lastLoc.lng?.toFixed(5)}
                  </div>
                )}

                <button
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sos/report/${session.sessionId}`,
                      '_blank',
                    )
                  }
                  className="mt-4 w-full bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  📄 Download Incident Report
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PCRDashboard

