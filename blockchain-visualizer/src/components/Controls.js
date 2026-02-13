import React from 'react';

export function Controls({
  difficulty,
  setDifficulty,
  dataInput,
  setDataInput,
  isMining,
  handleMineClick,
  pendingBlock
}) {
    //shows the difficulty level, mining a new block, and what nonce the block being mined at is,
    //and it also shows the time elapsed in milliseconds.
  return (
    <div className="controls-section">
      <div className="difficulty-selector">
        <h3>Difficulty Level</h3>
        <div className="difficulty-buttons">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
              onClick={() => {
                setDifficulty(level);
              }}
              disabled={isMining}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="mining-section">
        <h3>Mine New Block</h3>
        <div className="mining-input-group">
          <input
            type="text"
            placeholder="Alice pays Bob 10"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            disabled={isMining}
            className="data-input"
          />
          <button 
            className="mine-button"
            onClick={handleMineClick} 
            disabled={isMining || !dataInput.trim()}
          >
            {isMining ? (
              <span>
                <span className="spinner"></span>
                Mining...
              </span>
            ) : (
              'Mine Block'
            )}
          </button>
           {isMining && pendingBlock && (
        <div className="mining-progress">
          <div className="progress-info">
            <span>Nonce: <strong>{pendingBlock.nonce}</strong></span>
            <span>Time: <strong>{pendingBlock.elapsed}ms</strong></span>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
