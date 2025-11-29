import React from 'react';

const ResourcesTable = ({ resources, selectedResourceIds, onSelect }) => {
    const handleSelect = (id) => {
        onSelect(id);
    };

    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            border: '1px solid #333',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #333', backgroundColor: '#252525', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff' }}>Available Resources</h3>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2c2c2c', color: '#aaa', textAlign: 'left' }}>
                            <th style={{ padding: '14px 20px', fontWeight: '600' }}>Resource</th>
                            <th style={{ padding: '14px 20px', fontWeight: '600' }}>Name</th>
                            <th style={{ padding: '14px 20px', fontWeight: '600' }}>ETA</th>
                            <th style={{ padding: '14px 20px', fontWeight: '600' }}>Duration</th>
                            <th style={{ padding: '14px 20px', fontWeight: '600', width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((resource) => {
                            const isSelected = selectedResourceIds.includes(resource.id);
                            return (
                                <tr
                                    key={resource.id}
                                    onClick={() => handleSelect(resource.id)}
                                    style={{
                                        borderBottom: '1px solid #333',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? 'rgba(33, 150, 243, 0.15)' : 'transparent',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <td style={{ padding: '14px 20px', fontWeight: '500', color: '#fff' }}>{resource.id}</td>
                                    <td style={{ padding: '14px 20px', color: '#ccc' }}>
                                        {resource.type}
                                        {resource.isAiSuggested && (
                                            <span style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                marginLeft: '8px',
                                                display: 'inline-block'
                                            }}>
                                                AI Suggested
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: resource.eta < 10 ? '#81c784' : '#ffb74d', fontWeight: 'bold' }}>{resource.eta} min ETA</td>
                                    <td style={{ padding: '14px 20px', color: '#ccc' }}>{resource.distance} km</td>
                                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            border: isSelected ? '2px solid #2196F3' : '2px solid #666',
                                            backgroundColor: isSelected ? 'transparent' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2196F3' }}></div>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResourcesTable;
