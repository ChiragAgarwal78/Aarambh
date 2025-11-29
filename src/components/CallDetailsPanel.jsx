import React, { useState } from 'react';

const InputField = ({ label, value, name, onChange, isEditing, type = "text" }) => (
    <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#aaa', marginBottom: '6px', letterSpacing: '0.5px' }}>
            {label} <span style={{ color: '#64b5f6', fontWeight: 'normal', fontSize: '10px', marginLeft: '4px' }}>(AI Suggested)</span>
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={!isEditing}
            style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: isEditing ? '1px solid #2196F3' : '1px solid #333',
                backgroundColor: isEditing ? 'rgba(33, 150, 243, 0.1)' : '#2c2c2c',
                color: isEditing ? '#fff' : '#ccc',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
            }}
        />
    </div>
);

const CallDetailsPanel = ({ data, isEditing, onChange }) => {
    const [callStatus, setCallStatus] = useState('connected'); // connected, disconnected, callback

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected': return '#4caf50';
            case 'disconnected': return '#d32f2f';
            case 'callback': return '#ff9800';
            default: return '#757575';
        }
    };

    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            border: '1px solid #333',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Caller Details</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(callStatus), boxShadow: `0 0 8px ${getStatusColor(callStatus)}` }}></div>
                    <select
                        value={callStatus}
                        onChange={(e) => setCallStatus(e.target.value)}
                        style={{
                            backgroundColor: '#2c2c2c',
                            color: 'white',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '100px'
                        }}
                    >
                        <option value="connected">Connected</option>
                        <option value="disconnected">Disconnected</option>
                        <option value="callback">Callback Needed</option>
                    </select>
                </div>
            </div>

            <InputField label="Caller Name" name="callerName" value={data.callerName} onChange={onChange} isEditing={isEditing} />
            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                    <InputField label="Age" name="age" value={data.age} onChange={onChange} isEditing={isEditing} type="number" />
                </div>
                <div style={{ flex: 2 }}>
                    <InputField label="Phone" name="phone" value={data.phone} onChange={onChange} isEditing={isEditing} />
                </div>
            </div>
            <InputField label="Location" name="location" value={data.location} onChange={onChange} isEditing={isEditing} />
            <InputField label="Incident Type" name="incidentType" value={data.incidentType} onChange={onChange} isEditing={isEditing} />

            {/* Quick Actions for Call */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => setCallStatus('callback')}
                    style={{
                        flex: 1,
                        backgroundColor: '#2c2c2c',
                        border: '1px solid #444',
                        color: '#e0e0e0',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2c2c2c'}
                >
                    Request Callback
                </button>
                <button
                    onClick={() => setCallStatus('disconnected')}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        border: '1px solid #d32f2f',
                        color: '#ef5350',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(211, 47, 47, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(211, 47, 47, 0.1)'}
                >
                    End Call
                </button>
            </div>
        </div>
    );
};

export default CallDetailsPanel;
