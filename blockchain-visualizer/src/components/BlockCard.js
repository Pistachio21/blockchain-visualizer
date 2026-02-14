import React from 'react';
import { formatTimestamp, truncateHash } from '../blockchain/hashUtils';

export function BlockCard({
  block,
  index,
  isEdited,
  editingBlock,
  validationStatus,
  isMining,
  allBlocks,
  currentData,
  onDataChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit
}) {
  const { isValid = true, isModified = false, hashValid = true, previousHashValid = true } = validationStatus || {};
  //displays the contents of the hash such as nonce, time mined, and checks for validity
  return (
    <div className={`block-card ${!block.hash ? 'pending' : ''} ${!isValid ? 'invalid' : ''} ${index === allBlocks.length - 1 && !isMining && isValid ? 'latest' : ''}`}>
      <div className="block-header">
        <span className="block-number">
          Block #{block.index}
          {!block.hash && ' ⛏️'}
          {!isValid}
          {editingBlock === index && ' ✏️'}
        </span>
        {!block.hash && <span className="latest-badge mining">MINING</span>}
        {block.hash && index === allBlocks.length - 1 && !isMining && isValid && <span className="latest-badge">LATEST</span>}
        {editingBlock === index && <span className="latest-badge editing">EDITING</span>}
      </div>
      <div className="block-content">
        <div className="block-row">
          <span className="block-label">Timestamp</span>
          <span className="block-value">{formatTimestamp(block.timestamp)}</span>
        </div>
        <div className="block-row">
          <span className="block-label">Data</span>
          {editingBlock === index ? (
            <input
              type="text"
              className="block-data-input"
              value={currentData}
              onChange={(e) => onDataChange(index, e.target.value)}
              autoFocus
            />
          ) : (
            <span className="block-value" style={isEdited ? { color: '#151212ff', fontWeight: 'bold' } : {}}>
              {currentData}
            </span>
          )}
        </div>
        <div className="block-row edit-row">
          {editingBlock === index ? (
            <>
              <button
                className="edit-save-btn"
                onClick={() => onSaveEdit(index)}
              >
                Save
              </button>
              <button
                className="edit-cancel-btn"
                onClick={() => onCancelEdit(index)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="edit-button"
              onClick={() => onStartEdit(index)}
              disabled={!block.hash}
            >
              Edit
            </button>
          )}
        </div>
        <div className="block-row">
          <span className="block-label">Nonce</span>
          <span className="block-value">{block.nonce}</span>
        </div>
        <div className="block-row">
          <span className="block-label">Hash</span>
          <span className="block-value hash" title={block.hash || 'Calculating...'}>
            {block.hash ? truncateHash(block.hash) : 'Calculating...'}
          </span>
        </div>
        {block.previousHash && (
          <div className="block-row">
            <span className="block-label">Previous Hash</span>
            <span className="block-value hash" title={block.previousHash}>
              {truncateHash(block.previousHash)}
            </span>
          </div>
        )}
        {block.miningDuration > 0 && (
          <div className="block-row">
            <span className="block-label">Mined In</span>
            <span className="block-value">{block.miningDuration}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
