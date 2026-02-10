import SHA256 from 'crypto-js/sha256';
import React, { useState, useCallback, useRef } from 'react';
import './App.css';

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.miningDuration = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      this.data +
      this.nonce
    ).toString();
  }

  mineBlock(difficulty, onProgress) {
    const target = Array(difficulty + 1).join('0');
    let miningComplete = false;
    const startTime = Date.now();
    
    const mineTick = () => {
      const hashesPerTick = difficulty === 1 ? 3 : difficulty === 2 ? 2 : 1;
      
      for (let i = 0; i < hashesPerTick; i++) {
        this.nonce++;
        this.hash = this.calculateHash();
      }
      
      const elapsed = Date.now() - startTime;
      onProgress(this.nonce, this.hash, elapsed);
      
      if (this.hash.substring(0, difficulty) !== target) {
        setTimeout(mineTick, 200);
      } else if (!miningComplete) {
        miningComplete = true;
        this.miningDuration = elapsed;
        onProgress(this.nonce, this.hash, this.miningDuration);
      }
    };
    
    mineTick();
  }
}

class Blockchain {
  constructor(difficulty = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  createGenesisBlock() {
    const genesis = new Block(0, Date.now().toString(), 'Genesis Block', '0');
    genesis.miningDuration = 0;
    genesis.nonce = 0;
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data, onProgress) {
    return new Promise((resolve) => {
      const newBlock = new Block(
        this.chain.length,
        Date.now().toString(),
        data,
        this.getLatestBlock().hash
      );
      
      let blockAdded = false;
      
      newBlock.mineBlock(this.difficulty, (nonce, hash, elapsed) => {
        onProgress(nonce, hash, elapsed || 0);
        
        const target = Array(this.difficulty + 1).join('0');
        if (hash.substring(0, this.difficulty) === target && !blockAdded) {
          blockAdded = true;
          this.chain.push(newBlock);
          resolve(newBlock);
        }
      });
    });
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  updateDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  updateBlockData(index, newData, onProgress) {
    if (index >= 0 && index < this.chain.length) {
      const block = this.chain[index];
      block.data = newData;
      block.nonce = 0;
      
      return new Promise((resolve) => {
        const startTime = Date.now();
        const target = Array(this.difficulty + 1).join('0');
        
        while (true) {
          block.nonce++;
          block.hash = block.calculateHash();
          
          if (block.hash.substring(0, this.difficulty) === target) {
            const elapsed = Date.now() - startTime;
            block.miningDuration = elapsed;
            if (onProgress) {
              onProgress(block.nonce, block.hash, elapsed);
            }
            resolve(block);
            break;
          }
        }
      });
    }
    return Promise.resolve(null);
  }
}

function calculateBlockHash(index, timestamp, data, previousHash, nonce) {
  return SHA256(
    index +
    previousHash +
    timestamp +
    data +
    nonce
  ).toString();
}

function App() {
  const [difficulty, setDifficulty] = useState(2);
  const [dataInput, setDataInput] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [isChainValid, setIsChainValid] = useState(true);
  const [pendingBlock, setPendingBlock] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [editedData, setEditedData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [originalHashes, setOriginalHashes] = useState({});
  const [originalNonces, setOriginalNonces] = useState({});
  const [editingBlock, setEditingBlock] = useState(null);
  const blockchainRef = useRef(new Blockchain(2));
  const isProcessingRef = useRef(false);

  // Initialize blocks on first render
  React.useEffect(() => {
    const initialBlocks = [...blockchainRef.current.chain];
    setBlocks(initialBlocks);
    
    // Store original data, hashes, and nonces
    const original = {};
    const hashes = {};
    const nonces = {};
    initialBlocks.forEach((block, index) => {
      original[index] = block.data;
      hashes[index] = block.hash;
      nonces[index] = block.nonce;
    });
    setOriginalData(original);
    setOriginalHashes(hashes);
    setOriginalNonces(nonces);
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString();
  };

  const truncateHash = (hash) => hash.length > 10 ? hash.substring(0, 10) + '...' : hash;

  const isBlockValid = (block, index) => {
    if (index === 0) return true;
    const prevBlock = blockchainRef.current.chain[index - 1];
    const expectedHash = calculateBlockHash(
      block.index,
      block.timestamp,
      block.data,
      block.previousHash,
      block.nonce
    );
    return block.hash === expectedHash && block.previousHash === prevBlock.hash;
  };

  const handleDataChange = (index, newData) => {
    // Store the edited data
    setEditedData(prev => ({
      ...prev,
      [index]: newData
    }));
    
    // Mark chain as invalid when any block is edited
    setIsChainValid(false);
  };

  const handleSaveEdit = (index) => {
    // Save the edit and restore original hash and nonce if reverting to original data
    const newData = editedData[index];
    if (newData !== undefined) {
      const block = blockchainRef.current.chain[index];
      
      // Check if we're restoring to original data
      if (newData === originalData[index]) {
        // Restore original hash and nonce - chain becomes valid again
        block.data = newData;
        block.hash = originalHashes[index];
        block.nonce = originalNonces[index];
      } else {
        block.data = newData;
        block.hash = block.calculateHash();
      }
      
      setBlocks([...blockchainRef.current.chain]);
      
      // Check if all the blocks match their original data
      let allBlocksMatchOriginal = true;
      for (let i = 0; i < blockchainRef.current.chain.length; i++) {
        const currentData = blockchainRef.current.chain[i].data;
        if (currentData !== originalData[i]) {
          allBlocksMatchOriginal = false;
          break;
        }
      }
      
      // Validate the chain
      if (allBlocksMatchOriginal) {
        const chainValid = blockchainRef.current.isChainValid();
        setIsChainValid(chainValid);
      } else {
        setIsChainValid(false);
      }
    }
    setEditingBlock(null);
  };

  const handleCancelEdit = (index) => {
    // Cancel edit and restore original data
    setEditedData(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    
    // Check if all the blocks match their original data
    let allBlocksMatchOriginal = true;
    for (let i = 0; i < blockchainRef.current.chain.length; i++) {
      const currentData = blockchainRef.current.chain[i].data;
      if (currentData !== originalData[i]) {
        allBlocksMatchOriginal = false;
        break;
      }
    }
    
    // Validate the chain
    if (allBlocksMatchOriginal) {
      const chainValid = blockchainRef.current.isChainValid();
      setIsChainValid(chainValid);
    } else {
      setIsChainValid(false);
    }
    
    setEditingBlock(null);
  };

  const handleMineClick = useCallback(() => {
    if (isProcessingRef.current || !dataInput.trim() || isMining) {
      return;
    }

    isProcessingRef.current = true;
    setIsMining(true);
    setIsChainValid(true);

    const newBlock = {
      index: blockchainRef.current.chain.length,
      timestamp: Date.now().toString(),
      data: dataInput.trim(),
      previousHash: blockchainRef.current.getLatestBlock().hash,
      nonce: 0,
      miningDuration: 0,
      hash: '',
      elapsed: 0,
    };
    setPendingBlock({ ...newBlock });

    const onProgress = (nonce, hash, elapsed) => {
      setPendingBlock(prev => prev ? { ...prev, nonce, hash, elapsed } : prev);
    };

    blockchainRef.current.addBlock(dataInput.trim(), onProgress)
      .then((minedBlock) => {
        setDataInput('');
        setPendingBlock(null);
        const newBlocks = [...blockchainRef.current.chain];
        setBlocks(newBlocks);
        
        // Store original data, hash, and nonce for the new block
        setOriginalData(prev => ({
          ...prev,
          [minedBlock.index]: minedBlock.data
        }));
        setOriginalHashes(prev => ({
          ...prev,
          [minedBlock.index]: minedBlock.hash
        }));
        setOriginalNonces(prev => ({
          ...prev,
          [minedBlock.index]: minedBlock.nonce
        }));
        
        setIsChainValid(blockchainRef.current.isChainValid());
      })
      .catch(error => {
        console.error('Mining failed:', error);
        setPendingBlock(null);
      })
      .finally(() => {
        setIsMining(false);
        isProcessingRef.current = false;
      });
  }, [dataInput, isMining]);

  const allBlocks = pendingBlock 
    ? [...blocks, pendingBlock] 
    : blocks;

  return (
    <div className="app">
      <h1>Blockchain Visualizer</h1>
      <div className="controls-section">
        <div className="difficulty-selector">
          <h3>Difficulty Level</h3>
          <p className="difficulty-description">Difficulty determines how many leading zeros the hash must start with</p>
          <div className="difficulty-buttons">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
                onClick={() => {
                  setDifficulty(level);
                  blockchainRef.current.updateDifficulty(level);
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
              placeholder="Enter block data (e.g., Alice pays Bob 10 BTC)"
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
          </div>
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

      <div className="blockchain-section">
        <h2>Blockchain ({blocks.length} blocks {isMining ? '+ 1 mining' : ''})</h2>
        <div className="blocks-container">
          {allBlocks.map((block, index) => {
            const blockValid = isBlockValid(block, index);
            const currentData = editedData[index] !== undefined ? editedData[index] : block.data;
            const isEdited = editedData[index] !== undefined;
            
            return (
              <React.Fragment key={block.hash || `pending-${block.index}`}>
                <div className={`block-card ${!block.hash ? 'pending' : ''} ${!blockValid ? 'invalid' : ''} ${index === allBlocks.length - 1 && !isMining && blockValid ? 'latest' : ''}`}>
                  <div className="block-header">
                    <span className="block-number">
                      Block #{block.index}
                      {!block.hash && ' ⛏️'}
                      {!blockValid && ' ⚠️'}
                      {editingBlock === index && ' ✏️'}
                    </span>
                    {!block.hash && <span className="latest-badge mining">MINING</span>}
                    {block.hash && index === allBlocks.length - 1 && !isMining && blockValid && <span className="latest-badge">LATEST</span>}
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
                          onChange={(e) => handleDataChange(index, e.target.value)}
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
                            onClick={() => handleSaveEdit(index)}
                          >
                            Save
                          </button>
                          <button
                            className="edit-cancel-btn"
                            onClick={() => handleCancelEdit(index)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="edit-button"
                          onClick={() => setEditingBlock(index)}
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
                      <span className="block-value hash" title={block.hash || 'Calculating...'}>{block.hash ? truncateHash(block.hash) : 'Calculating...'}</span>
                    </div>
                    {index > 0 && (
                      <div className="block-row">
                        <span className="block-label">Previous Hash</span>
                        <span 
                          className={`block-value prev-hash ${block.previousHash === allBlocks[index-1].hash ? 'matched' : 'mismatched'}`}
                          title={block.previousHash}
                        >
                          {truncateHash(block.previousHash)}
                        </span>
                      </div>
                    )}
                    <div className="block-row time">
                      <span className="block-label">Time Mined</span>
                      <span className="block-value">
                        {block.hash ? `${block.miningDuration}ms` : (block.elapsed ? `${block.elapsed}ms` : 'Mining...')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {index < allBlocks.length - 1 && (
                  <div className="block-arrow">
                    <div className="arrow-line"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;