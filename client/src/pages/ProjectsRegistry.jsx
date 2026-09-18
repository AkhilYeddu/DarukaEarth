import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import CreateProjectModal from '../components/CreateProjectModal';
import {
  Layers,
  MapPin,
  Plus,
  TreePine,
  ShieldCheck,
  TrendingUp,
  Globe,
  ArrowUpRight,
  Search,
  ExternalLink,
} from 'lucide-react';

const ProjectsRegistry = ({ onNavigateToMap, onSelectSiteForAnalytics }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getAll();
      if (res.success) {
        setProjects(res.data || []);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalHectares = projects.reduce((acc, p) => acc + (p.totalHectares || 0), 0);
  const totalTargetCredits = projects.reduce((acc, p) => acc + (p.targetCreditsTonnes || 0), 0);
  const totalSitesCount = projects.reduce((acc, p) => acc + (p.siteCount || 0), 0);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '2rem' }}>Projects Registry</h1>
            <span className="badge badge-emerald">{projects.length} Active Portfolios</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Centralized registry of nature-based carbon and biodiversity restoration initiatives
          </p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          <span>Register New Project</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              TOTAL PROJECTS
            </span>
            <Layers size={18} color="var(--emerald-400)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{projects.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across 3 Continents
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MANAGED AREA</span>
            <Globe size={18} color="var(--cyan-400)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
            {Math.round(totalHectares).toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>ha</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Monitored via Satellite
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              GEOSPATIAL SITES
            </span>
            <MapPin size={18} color="var(--emerald-400)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
            {totalSitesCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>Polygons</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            GeoJSON 2dsphere Indexed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              TARGET CREDITS
            </span>
            <TrendingUp size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fbbf24' }}>
            {totalTargetCredits.toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>tCO2e</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Under Registry Standards
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: '6px 0' }}
            placeholder="Search projects by name, country, or biome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            'ALL',
            'Reforestation',
            'Mangrove Restoration',
            'Agroforestry',
            'Peatland Conservation',
          ].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={typeFilter === type ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              style={{ fontSize: '0.78rem' }}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading projects registry...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <TreePine size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No projects match your filter</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Try resetting your search query or create a new project.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span className="badge badge-emerald">{project.projectType}</span>
                  <span className="badge badge-cyan">{project.standard}</span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', lineHeight: 1.3 }}>
                  {project.name}
                </h3>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--cyan-400)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe size={14} />
                  <span>
                    {project.country} {project.region ? `• ${project.region}` : ''}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: '20px',
                  }}
                >
                  {project.description}
                </p>

                {/* Project Sites List preview */}
                {project.sites && project.sites.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '8px',
                      }}
                    >
                      ASSIGNED GEOGRAPHICAL SITES ({project.sites.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {project.sites.map((site) => (
                        <div
                          key={site._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            padding: '4px 0',
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>📍 {site.name}</span>
                          <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
                            {site.areaHectares} ha
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Summary */}
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px',
                    marginBottom: '18px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      MANAGED HECTARES
                    </div>
                    <div
                      style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald-400)' }}
                    >
                      {project.totalHectares || 0} ha
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      TARGET CREDITS
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                      {project.targetCreditsTonnes?.toLocaleString()} tCO2e
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => onNavigateToMap(project._id)}
                    className="btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Globe size={15} />
                    <span>View on Map</span>
                  </button>
                  {project.sites && project.sites.length > 0 && (
                    <button
                      onClick={() => onSelectSiteForAnalytics(project.sites[0]._id)}
                      className="btn-secondary btn-sm"
                      title="View Site Analytics"
                    >
                      <ArrowUpRight size={15} />
                      <span>Analytics</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => fetchProjects()}
      />
    </div>
  );
};

export default ProjectsRegistry;
