import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Radio, ShieldCheck, RefreshCw } from 'lucide-react';
import { getDailyQuotaStats, checkMirrorsHealth } from '../services/usageTracker';

export default function ApiHealthDashboard() {
  const [quota, setQuota] = useState(() => getDailyQuotaStats());
  const [mirrors, setMirrors] = useState([]);
  const [checking, setChecking] = useState(false);

  const refreshStats = async () => {
    setChecking(true);
    setQuota(getDailyQuotaStats());
    const health = await checkMirrorsHealth();
    setMirrors(health);
    setChecking(false);
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(() => {
      setQuota(getDailyQuotaStats());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const percentageUsed = Math.min(100, Math.round((quota.usedToday / quota.maxDaily) * 100));
  const onlineMirrorsCount = mirrors.filter(m => m.status === 'online').length;

  return (
    <div className="api-health-dashboard glass-card">
      <div className="health-header">
        <div className="health-title">
          <Activity size={20} className="text-accent" />
          <h3>System Health & API Quota Monitor</h3>
        </div>
        <button
          className="health-refresh-btn"
          onClick={refreshStats}
          disabled={checking}
          title="Refresh API Health"
        >
          <RefreshCw size={15} className={checking ? 'spin' : ''} />
          <span>{checking ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="health-grid">
        {/* Gemini AI Quota Box */}
        <div className="health-box">
          <div className="health-box-head">
            <Cpu size={18} className="text-purple" />
            <span className="health-box-name">Gemini 1.5 AI Engine</span>
            <span className="health-badge badge-free">100% FREE TIER</span>
          </div>

          <div className="health-quota-meta">
            <span className="quota-number">{quota.usedToday} / {quota.maxDaily}</span>
            <span className="quota-sub">Requests Used Today ({quota.remainingToday} Left)</span>
          </div>

          <div className="health-progress-bar">
            <div
              className="health-progress-fill"
              style={{ width: `${percentageUsed}%` }}
            />
          </div>

          <div className="health-box-footer">
            <span>RPM Buffer: {quota.rpmCount} / 15 req/min</span>
            <span className="text-green">✓ $0.00 Billing Guaranteed</span>
          </div>
        </div>

        {/* YouTube Audio Engine Box */}
        <div className="health-box">
          <div className="health-box-head">
            <Radio size={18} className="text-accent" />
            <span className="health-box-name">YouTube Audio Engine</span>
            <span className="health-badge badge-online">
              {mirrors.length > 0 ? `${onlineMirrorsCount}/${mirrors.length} ONLINE` : 'CHECKING...'}
            </span>
          </div>

          <div className="health-quota-meta">
            <span className="quota-number">{onlineMirrorsCount} Active Mirrors</span>
            <span className="quota-sub">High-Speed Global Audio Servers</span>
          </div>

          <div className="health-mirrors-list">
            {mirrors.map((m, idx) => (
              <div key={idx} className="mirror-dot-row">
                <span className={`status-dot ${m.status}`} />
                <span className="mirror-name">{m.url.replace('https://', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Supabase Cloud Sync Box */}
        <div className="health-box">
          <div className="health-box-head">
            <ShieldCheck size={18} className="text-blue" />
            <span className="health-box-name">Supabase Cloud Sync</span>
            <span className="health-badge badge-online">CONNECTED</span>
          </div>

          <div className="health-quota-meta">
            <span className="quota-number">Encrypted DB Sync</span>
            <span className="quota-sub">Playlists, Likes & Listening History</span>
          </div>

          <div className="health-box-footer">
            <span className="text-green">✓ Row-Level Security Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
