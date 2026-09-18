import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe, Layers, BarChart3, LogOut, Shield, User, Sparkles } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAuthenticated, quickDemoLogin } = useAuth();

  return (
    <header
      className="glass-panel"
      style={{
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        {/* Brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          onClick={() => setActiveTab('map')}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Globe size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Darukaa<span style={{ color: 'var(--emerald-400)' }}>.Earth</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                Geospatial v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
              Carbon & Biodiversity Analytics Platform
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        {isAuthenticated && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(13, 21, 39, 0.6)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setActiveTab('map')}
              className={activeTab === 'map' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              style={{ border: 'none' }}
            >
              <Globe size={16} />
              <span>Interactive Map</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={activeTab === 'projects' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              style={{ border: 'none' }}
            >
              <Layers size={16} />
              <span>Projects Registry</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              style={{ border: 'none' }}
            >
              <BarChart3 size={16} />
              <span>Site Analytics</span>
            </button>
          </nav>
        )}

        {/* Right User State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isAuthenticated ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background:
                      user?.role === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: user?.role === 'admin' ? 'var(--emerald-400)' : 'var(--cyan-400)',
                  }}
                >
                  {user?.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {user?.role?.toUpperCase()} • {user?.organization || 'Darukaa'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-secondary btn-sm"
                title="Sign Out"
                style={{ color: '#f87171' }}
              >
                <LogOut size={16} />
                <span>Exit</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => quickDemoLogin('admin')} className="btn-primary btn-sm">
                <Sparkles size={15} />
                <span>Quick Demo Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
