import React, { useState } from 'react';

const VitalBadge = ({ label, isActive, onClick, isEditing, activeColor = '#cf6679' }) => (
    <div
        onClick={() => isEditing && onClick()}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: isActive ? activeColor : '#2c2c2c',
            color: isActive ? '#fff' : '#aaa',
            fontSize: '13px',
            fontWeight: '600',
            marginRight: '10px',
            marginBottom: '10px',
            cursor: isEditing ? 'pointer' : 'default',
            border: isEditing ? (isActive ? `1px solid #ff8a80` : `1px solid #555`) : '1px solid transparent',
            opacity: isActive ? 1 : 0.8,
            transition: 'all 0.2s',
            userSelect: 'none'
        }}
    >
        {label}
        {isActive && <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>!</span>}
    </div>
);

const SituationPanel = ({ data, isEditing, onToggleVital, onAddSymptom, onRemoveSymptom }) => {
    const [newSymptom, setNewSymptom] = useState('');

    const handleAdd = () => {
        if (newSymptom.trim()) {
            onAddSymptom(newSymptom.trim());
            setNewSymptom('');
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
            boxSizing: 'border-box',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff' }}>Situation Assessment</h3>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: data.fakeProbability < 20 ? '#81c784' : '#ffb74d', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                    Fake Prob: {data.fakeProbability}% (LOW)
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vitals</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    <VitalBadge
                        label="Unconscious"
                        isActive={data.isUnconscious}
                        onClick={() => onToggleVital('isUnconscious')}
                        isEditing={isEditing}
                    />
                    <VitalBadge
                        label="Not Breathing"
                        isActive={data.isNotBreathing}
                        onClick={() => onToggleVital('isNotBreathing')}
                        isEditing={isEditing}
                    />
                </div>
            </div>

            <div>
                <h4 style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reported Symptoms</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.symptoms.map((symptom, index) => (
                        <li key={index} style={{
                            padding: '10px 12px',
                            backgroundColor: '#2c2c2c',
                            marginBottom: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '14px',
                            color: '#e0e0e0',
                            borderLeft: '3px solid #2196F3'
                        }}>
                            {symptom}
                            {isEditing && (
                                <button
                                    onClick={() => onRemoveSymptom(index)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#cf6679',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '0 4px'
                                    }}
                                >
                                    REMOVE
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                {isEditing && (
                    <div style={{ display: 'flex', marginTop: '12px' }}>
                        <input
                            type="text"
                            value={newSymptom}
                            onChange={(e) => setNewSymptom(e.target.value)}
                            placeholder="Add symptom..."
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '6px 0 0 6px',
                                border: '1px solid #2196F3',
                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                color: 'white',
                                outline: 'none'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0 6px 6px 0',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            ADD
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SituationPanel;
