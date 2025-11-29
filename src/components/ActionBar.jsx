import React from 'react';

const ActionButton = ({ label, color, onClick, flex = false }) => (
    <button
        onClick={onClick}
        style={{
            backgroundColor: color,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s, box-shadow 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            flex: flex ? 1 : 'initial'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
        {label}
    </button>
);

const ActionBar = ({ onDispatch, onCancel, dispatchLabel }) => {
    return (
        <div style={{
            backgroundColor: '#1e1e1e',
            padding: '16px 24px',
            borderTop: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 -4px 10px rgba(0,0,0,0.2)',
            zIndex: 100,
            width: '100%',
            boxSizing: 'border-box',
            gap: '12px',
            borderRadius: '0 0 8px 8px' // Add rounded corners at bottom if it's inside a card, or just keep it flat
        }}>
            {/* Left Side: Critical Status Button */}
            <div style={{ flex: '0 0 auto' }}>
                <ActionButton
                    label="CRITICAL (RED)"
                    color="#d32f2f"
                    onClick={() => { }}
                />
            </div>

            {/* Right Side: Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                <ActionButton label="CANCEL" color="#d32f2f" onClick={onCancel} />
                <ActionButton label="OVERRIDE" color="#f57c00" onClick={() => alert('Override functionality not implemented')} />

                <ActionButton
                    label={dispatchLabel || "DISPATCH"}
                    color="#388e3c"
                    onClick={onDispatch}
                    flex={true} // Make dispatch button grow if needed, or just keep it standard
                />
            </div>
        </div>
    );
};

export default ActionBar;
