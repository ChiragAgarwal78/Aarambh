import React, { useState, useEffect } from 'react';
import CallDetailsPanel from './CallDetailsPanel';
import SituationPanel from './SituationPanel';
import GISMapPanel from './GISMapPanel';
import AgentChatPanel from './AgentChatPanel';
import ResourcesTable from './ResourcesTable';
import ActionBar from './ActionBar';
import { initialCallData, initialSituationData, initialResources, protocolSteps, mockLocations } from '../data/mockData';

const DispatcherDashboard = ({ onNavigate, sharedData }) => {
    const [callData, setCallData] = useState(initialCallData);
    const [situationData, setSituationData] = useState(initialSituationData);
    const [resources, setResources] = useState(initialResources);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedResourceIds, setSelectedResourceIds] = useState([initialResources[0].id]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (sharedData) {
            console.log("Received Shared Data:", sharedData);

            // Map shared data to dashboard state
            setCallData(prev => ({
                ...prev,
                callerName: sharedData.caller_name || prev.callerName,
                callerContact: sharedData.caller_phone || prev.callerContact,
                location: sharedData.gps_hint || sharedData.caller_location_free_text || prev.location,
                incidentType: sharedData.incident_type || prev.incidentType,
                status: "Connected"
            }));

            setSituationData(prev => ({
                ...prev,
                symptoms: sharedData.symptoms || prev.symptoms,
                conscious: sharedData.conscious === true,
                breathing: sharedData.breathing === true,
                notes: `[Voice Agent Intake]\nFake Probability: ${sharedData.fake_probability}%\nLanguage: ${sharedData.language} \nFirst Aid: ${sharedData.suggested_first_aid?.join(', ')} \n\nTranscript: ${sharedData.raw_transcript} `
            }));

            // Trigger update logic
            setTimeout(() => {
                setIsEditing(false);
            }, 100);
        }
    }, [sharedData]);

    // Recalculate everything when editing finishes
    useEffect(() => {
        if (!isEditing) {
            updateSystemState();
        }
    }, [isEditing]);

    const updateSystemState = () => {
        // 1. Update Location Coordinates
        let newCoordinates = callData.coordinates;
        if (mockLocations[callData.location]) {
            newCoordinates = mockLocations[callData.location];
        }

        // 2. Recalculate Resources (Distance & ETA)
        const updatedResources = resources.map(r => {
            // Simple mock distance calculation (Euclidean-ish)
            // 1 degree lat/long is roughly 111km.
            const dist = Math.sqrt(
                Math.pow(r.baseCoordinates[0] - newCoordinates[0], 2) +
                Math.pow(r.baseCoordinates[1] - newCoordinates[1], 2)
            ) * 111;

            const newDistance = parseFloat(dist.toFixed(1));
            // Assume average speed of 30km/h -> 0.5 km/min
            // ETA = distance * 2 + 1 min startup
            const newEta = parseFloat((newDistance * 2 + 1).toFixed(1));

            // 3. Update AI Suggestions based on Incident Type
            let suggested = false;
            const type = callData.incidentType ? callData.incidentType.toLowerCase() : "";
            const rType = r.type.toLowerCase();

            if (type.includes('fire')) {
                if (rType.includes('fire') || rType.includes('police') || rType.includes('ambulance')) suggested = true;
            } else if (type.includes('murder') || type.includes('fight') || type.includes('violence') || type.includes('robbery')) {
                if (rType.includes('police') || rType.includes('ambulance')) suggested = true;
            } else if (type.includes('cardiac') || type.includes('heart') || type.includes('pregnancy') || type.includes('medical') || type.includes('breathing')) {
                if (rType.includes('ambulance')) suggested = true;
            }

            return {
                ...r,
                distance: newDistance,
                eta: newEta,
                isAiSuggested: suggested
            };
        });

        // Sort: Suggested first, then by ETA
        updatedResources.sort((a, b) => {
            if (a.isAiSuggested === b.isAiSuggested) {
                return a.eta - b.eta;
            }
            return a.isAiSuggested ? -1 : 1;
        });

        setCallData(prev => ({ ...prev, coordinates: newCoordinates }));
        setResources(updatedResources);

        // Auto-select the first suggested resource if available
        const firstSuggested = updatedResources.find(r => r.isAiSuggested);
        if (firstSuggested) {
            setSelectedResourceIds([firstSuggested.id]);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleCallDataChange = (e) => {
        const { name, value } = e.target;
        setCallData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleVital = (vital) => {
        if (!isEditing) return;
        setSituationData(prev => ({ ...prev, [vital]: !prev[vital] }));
    };

    const handleAddSymptom = (symptom) => {
        setSituationData(prev => ({ ...prev, symptoms: [...prev.symptoms, symptom] }));
    };

    const handleRemoveSymptom = (index) => {
        setSituationData(prev => ({
            ...prev,
            symptoms: prev.symptoms.filter((_, i) => i !== index)
        }));
    };

    const handleResourceSelect = (id) => {
        setSelectedResourceIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleDispatch = () => {
        const selectedResources = resources.filter(r => selectedResourceIds.includes(r.id));
        if (selectedResources.length > 0) {
            const ids = selectedResources.map(r => r.id).join(', ');

            const dispatchPayload = {
                callData,
                situationData,
                selectedResources,
                timestamp: new Date().toISOString()
            };

            console.log('DISPATCH PAYLOAD:', dispatchPayload);

            const confirmMsg = `DISPATCH INITIATED\n\nUnits: ${ids} \nLocation: ${callData.location} \nIncident: ${callData.incidentType} \n\nNotifying units...`;
            alert(confirmMsg);

        } else {
            alert('Please select at least one resource to dispatch.');
        }
    };

    const getDispatchLabel = () => {
        if (selectedResourceIds.length === 0) return "SELECT RESOURCE";
        if (selectedResourceIds.length === 1) {
            const r = resources.find(res => res.id === selectedResourceIds[0]);
            if (r) {
                if (r.type.includes('Ambulance')) return "DISPATCH AMBULANCE";
                if (r.type.includes('Fire')) return "DISPATCH FIRE";
                if (r.type.includes('Police')) return "DISPATCH POLICE";
            }
            return "DISPATCH RESOURCE";
        }
        return `DISPATCH ${selectedResourceIds.length} UNITS`;
    };

    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            backgroundColor: '#121212',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: '#e0e0e0'
        }}>
            <style>
                {`
    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 2fr 350px; /* Left (1) : Map (2) Ratio */
        gap: 20px;
        margin-bottom: 0;
        height: calc(100vh - 80px); /* Adjust based on header */
    }
    .left-col {
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
        min-width: 300px;
    }
    .middle-col {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .right-col {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    @media(max-width: 1600px) {
        .dashboard-grid {
            grid-template-columns: 1fr 1.5fr 320px;
        }
    }

    @media(max-width: 1200px) {
        .dashboard-grid {
            grid-template-columns: 1fr 1fr;
            height: auto;
        }
        .left-col { grid-column: 1; }
        .middle-col { grid-column: 2; }
        .right-col { grid-column: 1 / span 2; }
    }

    @media(max-width: 768px) {
        .dashboard-grid {
            grid-template-columns: 1fr;
        }
        .left-col, .middle-col, .right-col { grid-column: 1; }
    }

    /* Reset */
    body { margin: 0; padding: 0; }
`}

            </style>

            {/* Header */}
            <header style={{
                backgroundColor: '#1e1e1e',
                color: 'white',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                zIndex: 100,
                borderBottom: '1px solid #333'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Aarambh 112</div>
                        <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: '500' }}>Computer Aided Dispatch System</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#e0e0e0' }}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <button
                        onClick={handleEditToggle}
                        style={{
                            backgroundColor: isEditing ? '#4caf50' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {isEditing ? 'Done Editing' : 'Edit'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '20px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>

                <div className="dashboard-grid">
                    {/* Left Column: Caller & Situation */}
                    <div className="left-col">
                        <div style={{ flex: '0 0 auto' }}>
                            <CallDetailsPanel
                                data={callData}
                                isEditing={isEditing}
                                onChange={handleCallDataChange}
                            />
                        </div>
                        <div style={{ flex: '1 1 auto' }}>
                            <SituationPanel
                                data={situationData}
                                isEditing={isEditing}
                                onToggleVital={handleToggleVital}
                                onAddSymptom={handleAddSymptom}
                                onRemoveSymptom={handleRemoveSymptom}
                            />
                        </div>
                    </div>

                    {/* Middle Column: Map & Resources */}
                    <div className="middle-col">
                        <div style={{ flex: '1 1 50%', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                            <GISMapPanel
                                coordinates={callData.coordinates}
                                locationName={callData.location}
                                resources={resources}
                                selectedResourceIds={selectedResourceIds}
                            />
                        </div>
                        <div style={{ flex: '1 1 30%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <ResourcesTable
                                resources={resources}
                                selectedResourceIds={selectedResourceIds}
                                onSelect={handleResourceSelect}
                            />
                        </div>
                        <div style={{ flex: '0 0 auto' }}>
                            <ActionBar
                                onDispatch={handleDispatch}
                                onCancel={() => alert('Dispatch Cancelled. Resetting form...')}
                                dispatchLabel={getDispatchLabel()}
                            />
                        </div>
                    </div>

                    {/* Right Column: Agent Chat */}
                    <div className="right-col">
                        <AgentChatPanel initialSteps={protocolSteps} />
                    </div>
                </div>

            </main>


        </div>
    );
};

export default DispatcherDashboard;

