import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import MapDashboard from './components/MapDashboard';
import ProjectsRegistry from './pages/ProjectsRegistry';
import SiteAnalytics from './pages/SiteAnalytics';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'projects' | 'analytics'
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const handleSelectSiteForAnalytics = (siteId) => {
    setSelectedSiteId(siteId);
    setActiveTab('analytics');
  };

  const handleNavigateToMapWithProject = (projectId) => {
    setActiveTab('map');
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: 'var(--emerald-400)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>INITIALIZING DARUKAA.EARTH...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        {authView === 'login' ? (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'map' && (
          <MapDashboard
            onSelectSite={handleSelectSiteForAnalytics}
            initialSelectedSiteId={selectedSiteId}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsRegistry
            onNavigateToMap={handleNavigateToMapWithProject}
            onSelectSiteForAnalytics={handleSelectSiteForAnalytics}
          />
        )}
        {activeTab === 'analytics' && (
          <SiteAnalytics
            selectedSiteId={selectedSiteId}
            onSelectSite={(id) => setSelectedSiteId(id)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
