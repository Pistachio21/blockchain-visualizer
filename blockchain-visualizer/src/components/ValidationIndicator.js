import React from 'react';

export function ValidationIndicator({ isChainValid }) {
  return (
    <div className={`validation-indicator ${isChainValid ? 'valid' : 'invalid'}`}>
      <div className="validation-icon">{isChainValid ? '✓' : '✗'}</div>
      <div className="validation-text">
        <div className="validation-status">{isChainValid ? 'CHAIN VALID' : 'CHAIN INVALID'}</div>
        <div className="validation-detail">
          {isChainValid 
            ? 'The chain is valid.' 
            : 'The chain is invalid.'}
        </div>
      </div>
    </div>
  );
}
