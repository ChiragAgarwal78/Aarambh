import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issues in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const incidentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const fireIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const policeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const getIconForType = (type) => {
    if (type.includes('Fire')) return fireIcon;
    if (type.includes('Police')) return policeIcon;
    return ambulanceIcon;
};

// Component to update map center when coordinates change
const MapUpdater = ({ center, trigger }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, trigger, map]);
    return null;
};

const GISMapPanel = ({ coordinates = [19.0178, 72.8478], locationName = "Incident Location", resources = [], selectedResourceIds = [] }) => {
    const [showRoutes, setShowRoutes] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [recenterTrigger, setRecenterTrigger] = useState(0);

    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            border: '1px solid #333',
            height: isExpanded ? '600px' : '100%',
            minHeight: '300px',
            overflow: 'hidden',
            position: 'relative',
            zIndex: isExpanded ? 1000 : 0,
            transition: 'height 0.3s ease'
        }}>
            <MapContainer
                center={coordinates}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Incident Marker */}
                <Marker position={coordinates} icon={incidentIcon}>
                    <Popup>
                        <strong>{locationName}</strong><br />
                        INCIDENT LOCATION
                    </Popup>
                </Marker>

                {/* Resource Markers */}
                {resources.map(resource => {
                    if (!resource.coordinates) return null;
                    const isSelected = selectedResourceIds.includes(resource.id);
                    return (
                        <React.Fragment key={resource.id}>
                            <Marker position={resource.coordinates} icon={getIconForType(resource.type)}>
                                <Popup>
                                    <strong>{resource.id}</strong><br />
                                    {resource.type}<br />
                                    ETA: {resource.eta} min
                                </Popup>
                            </Marker>

                            {/* Route Line */}
                            {showRoutes && isSelected && (
                                <Polyline
                                    positions={[resource.coordinates, coordinates]}
                                    color={resource.type.includes('Fire') ? 'orange' : resource.type.includes('Police') ? 'violet' : '#2196F3'}
                                    dashArray="10, 10"
                                    weight={4}
                                    opacity={0.8}
                                >
                                    <Popup>ETA: {resource.eta} min</Popup>
                                </Polyline>
                            )}
                        </React.Fragment>
                    );
                })}

                <MapUpdater center={coordinates} trigger={recenterTrigger} />
            </MapContainer>

            {/* Controls Overlay */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                display: 'flex',
                gap: '8px'
            }}>
                <button
                    onClick={() => setRecenterTrigger(prev => prev + 1)}
                    style={{
                        backgroundColor: '#2c2c2c',
                        color: 'white',
                        border: '1px solid #444',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Recenter Map"
                >
                    ⌖ Recenter
                </button>
                <button
                    onClick={() => setShowRoutes(!showRoutes)}
                    style={{
                        backgroundColor: showRoutes ? '#2196F3' : '#2c2c2c',
                        color: 'white',
                        border: '1px solid #444',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontSize: '12px'
                    }}
                >
                    {showRoutes ? 'Hide Routes' : 'Show Routes'}
                </button>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        backgroundColor: '#2c2c2c',
                        color: 'white',
                        border: '1px solid #444',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontSize: '12px'
                    }}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </button>
            </div>

            {/* Legend Overlay */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                backgroundColor: 'rgba(30, 30, 30, 0.9)',
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                fontSize: '12px',
                zIndex: 1000,
                color: '#e0e0e0',
                border: '1px solid #444'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #555', paddingBottom: '4px' }}>Legend</div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#ff4444', borderRadius: '50%', marginRight: '8px' }}></div> Incident
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#2196F3', borderRadius: '50%', marginRight: '8px' }}></div> Ambulance
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: 'orange', borderRadius: '50%', marginRight: '8px' }}></div> Fire
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: 'violet', borderRadius: '50%', marginRight: '8px' }}></div> Police
                </div>
            </div>
        </div>
    );
};

export default GISMapPanel;
