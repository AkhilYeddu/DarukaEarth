import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { siteAPI, projectAPI } from '../services/api';
import CreateSiteModal from './CreateSiteModal';
import CreateProjectModal from './CreateProjectModal';
import {
  Layers,
  MapPin,
  PenTool,
  Plus,
  Compass,
  BarChart2,
  Filter,
  CheckCircle,
  Eye,
  Info,
  Maximize2,
} from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// High-performance open basemaps (Carto Dark Matter & Esri World Satellite)
const CARTO_DARK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

const MapDashboard = ({ onSelectSite, initialSelectedSiteId = null }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const drawInstance = useRef(null);

  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [macroStats, setMacroStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState(null);
  const [activeLayer, setActiveLayer] = useState('dark'); // 'dark' | 'satellite'
  const [selectedSitePopup, setSelectedSitePopup] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sitesRes, projectsRes, statsRes] = await Promise.all([
        siteAPI.getAll(),
        projectAPI.getAll(),
        projectAPI.getMacroStats(),
      ]);

      if (sitesRes.success) setSites(sitesRes.data || []);
      if (projectsRes.success) setProjects(projectsRes.data || []);
      if (statsRes.success) setMacroStats(statsRes.data || null);
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStyleForLayer = (layerType) => {
    if (MAPBOX_TOKEN) {
      return layerType === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/dark-v11';
    }
    return layerType === 'satellite' ? ESRI_SATELLITE_STYLE : CARTO_DARK_STYLE;
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: getStyleForLayer(activeLayer),
      center: [78.9629, 20.5937], // Center over India initially (featured projects)
      zoom: 4.2,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Initialize Mapbox Draw for polygon drawing
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.35,
          },
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#34d399',
            'line-dasharray': [0.2, 2],
            'line-width': 3,
          },
        },
        {
          id: 'gl-draw-point-active',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 7,
            'circle-color': '#06b6d4',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        },
      ],
    });

    map.addControl(draw, 'top-left');
    drawInstance.current = draw;

    // Listen to polygon creation
    map.on('draw.create', (e) => {
      const feature = e.features[0];
      if (feature && feature.geometry && feature.geometry.type === 'Polygon') {
        setDrawnGeometry(feature.geometry);
        setIsSiteModalOpen(true);
      }
    });

    map.on('load', () => {
      mapInstance.current = map;
      renderSitePolygons(map, sites);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Render or update polygons on map
  const renderSitePolygons = (map, sitesList) => {
    if (!map || !map.isStyleLoaded()) return;

    const filtered =
      selectedProjectId === 'ALL'
        ? sitesList
        : sitesList.filter(
            (s) =>
              s.projectId &&
              (s.projectId._id === selectedProjectId ||
                s.projectId.id === selectedProjectId ||
                s.projectId === selectedProjectId)
          );

    const geojsonData = {
      type: 'FeatureCollection',
      features: filtered.map((site) => ({
        type: 'Feature',
        id: site._id || site.id,
        geometry: site.geometry,
        properties: {
          id: site._id || site.id,
          name: site.name,
          biome: site.biome,
          areaHectares: site.areaHectares,
          healthStatus: site.healthStatus,
          canopyTargetPct: site.canopyTargetPct,
          projectName: site.projectId?.name || 'Ecological Project',
          color:
            site.biome === 'Mangrove Estuary'
              ? '#06b6d4'
              : site.biome === 'Tropical Rainforest'
                ? '#10b981'
                : site.biome === 'Montane Cloud Forest'
                  ? '#34d399'
                  : '#f59e0b',
        },
      })),
    };

    if (map.getSource('darukaa-sites-src')) {
      map.getSource('darukaa-sites-src').setData(geojsonData);
    } else {
      map.addSource('darukaa-sites-src', {
        type: 'geojson',
        data: geojsonData,
      });

      // Polygon fill layer
      map.addLayer({
        id: 'darukaa-sites-fill',
        type: 'fill',
        source: 'darukaa-sites-src',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.45,
        },
      });

      // Polygon outline border layer
      map.addLayer({
        id: 'darukaa-sites-line',
        type: 'line',
        source: 'darukaa-sites-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      });

      // Click on polygon to open popup and view analytics
      map.on('click', 'darukaa-sites-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          setSelectedSitePopup(feature.properties);
        }
      });

      // Cursor hover feedback
      map.on('mouseenter', 'darukaa-sites-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'darukaa-sites-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  };

  // Re-render polygons when sites or project filter changes
  useEffect(() => {
    if (mapInstance.current) {
      renderSitePolygons(mapInstance.current, sites);
    }
  }, [sites, selectedProjectId]);

  // Handle layer switcher (dark vs satellite)
  const toggleLayer = (layer) => {
    setActiveLayer(layer);
    if (mapInstance.current) {
      mapInstance.current.setStyle(getStyleForLayer(layer));
      mapInstance.current.once('style.load', () => {
        renderSitePolygons(mapInstance.current, sites);
      });
    }
  };

  // Fly to preset regions
  const flyToRegion = (lng, lat, zoom) => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [lng, lat],
        zoom,
        essential: true,
        speed: 1.2,
      });
    }
  };

  const handleStartDrawing = () => {
    if (drawInstance.current) {
      drawInstance.current.changeMode('draw_polygon');
    }
  };

  const handleSiteCreated = (newSite) => {
    setSites((prev) => [newSite, ...prev]);
    if (drawInstance.current) {
      drawInstance.current.deleteAll();
    }
    fetchData();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 65px)',
        overflow: 'hidden',
      }}
    >
      {/* Map Container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Floating Macro KPIs Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            MANAGED HECTARES
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
            {macroStats?.totalHectares
              ? `${macroStats.totalHectares.toLocaleString()} ha`
              : '3,891.9 ha'}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ACTIVE SITES</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
            {macroStats?.totalSites || sites.length || 4}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            SEQUESTERED CARBON
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
            {macroStats?.totalCarbonTonnes
              ? `${macroStats.totalCarbonTonnes.toLocaleString()} tCO2e`
              : '78,450 tCO2e'}
          </div>
        </div>
      </div>

      {/* Left Action Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 10,
          width: '320px',
        }}
      >
        {/* Draw Polygon & New Project Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Geospatial Actions</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              Admin Tools
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleStartDrawing}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <PenTool size={16} />
              <span>Draw Site Polygon</span>
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={16} />
              <span>Add New Project</span>
            </button>
          </div>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            Click 'Draw Site Polygon' then click points on map to define site boundary. Double-click
            to close.
          </p>
        </div>

        {/* Project Filter */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Filter size={15} color="var(--emerald-400)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filter by Project</span>
          </div>
          <select
            className="input-field"
            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="ALL">All Projects ({sites.length} sites)</option>
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Presets / Hotspots */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Featured Ecological Hotspots
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => flyToRegion(88.83, 22.15, 11)}
              className="btn-secondary btn-sm"
              style={{
                justifyContent: 'flex-start',
                fontSize: '0.76rem',
                background: 'rgba(6, 182, 212, 0.08)',
              }}
            >
              🌊 Sundarbans Mangroves (India)
            </button>
            <button
              onClick={() => flyToRegion(76.94, 10.3, 11.5)}
              className="btn-secondary btn-sm"
              style={{
                justifyContent: 'flex-start',
                fontSize: '0.76rem',
                background: 'rgba(16, 185, 129, 0.08)',
              }}
            >
              🌿 Western Ghats Canopy (India)
            </button>
            <button
              onClick={() => flyToRegion(-83.56, 8.55, 11.5)}
              className="btn-secondary btn-sm"
              style={{
                justifyContent: 'flex-start',
                fontSize: '0.76rem',
                background: 'rgba(251, 191, 36, 0.08)',
              }}
            >
              🦜 Costa Rica Cloud Corridor
            </button>
            <button
              onClick={() => flyToRegion(78.96, 20.59, 4.2)}
              className="btn-secondary btn-sm"
              style={{ justifyContent: 'center', fontSize: '0.74rem' }}
            >
              <Maximize2 size={13} style={{ marginRight: '4px' }} /> Global Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Right Map Layer Switcher */}
      <div style={{ position: 'absolute', top: '20px', right: '60px', zIndex: 10 }}>
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => toggleLayer('dark')}
            className={activeLayer === 'dark' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            style={{ fontSize: '0.76rem' }}
          >
            Dark Vector
          </button>
          <button
            onClick={() => toggleLayer('satellite')}
            className={activeLayer === 'satellite' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            style={{ fontSize: '0.76rem' }}
          >
            Satellite Imagery
          </button>
        </div>
      </div>

      {/* Site Popup Card when clicked */}
      {selectedSitePopup && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            width: '360px',
            zIndex: 10,
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              border: '1px solid var(--emerald-400)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
                  {selectedSitePopup.biome}
                </span>
                <h4 style={{ fontSize: '1.15rem', color: '#ffffff' }}>{selectedSitePopup.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Project: {selectedSitePopup.projectName}
                </div>
              </div>
              <button
                onClick={() => setSelectedSitePopup(null)}
                className="btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                margin: '14px 0',
                background: 'rgba(255,255,255,0.03)',
                padding: '10px',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SURFACE AREA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                  {selectedSitePopup.areaHectares} ha
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HEALTH STATUS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  {selectedSitePopup.healthStatus || 'Optimal'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectSite(selectedSitePopup.id)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <BarChart2 size={16} />
              <span>View Deep Site Analytics</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateSiteModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        drawnGeometry={drawnGeometry}
        projects={projects}
        onSiteCreated={handleSiteCreated}
      />

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          fetchData();
        }}
      />
    </div>
  );
};

export default MapDashboard;
