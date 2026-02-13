import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { Blockchain } from './blockchain/Blockchain';
import { calculateBlockHash } from './blockchain/hashUtils';
import { Controls } from './components/Controls';
import { ValidationIndicator } from './components/ValidationIndicator';
import { BlockCard } from './components/BlockCard';

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
  useEffect(() => {
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

  const getBlockValidationStatus = (block, index) => {
    if (index === 0) return { isValid: true };
    
    // Check if block data has been modified
    const isModified = editedData[index] !== undefined && editedData[index] !== originalData[index];
    
    const prevBlock = blockchainRef.current.chain[index - 1];
    const expectedHash = calculateBlockHash(
      block.index,
      block.timestamp,
      block.data,
      block.previousHash,
      block.nonce
    );
    
    // Hash is valid if it matches the calculated hash from current data
    const hashValid = block.hash === expectedHash;
    
    // Previous hash is valid if it matches the previous block's hash
    const previousHashValid = block.previousHash === prevBlock.hash;
    
    // Block is invalid if: modified, hash doesn't match, or previousHash doesn't match
    const isValid = !isModified && hashValid && previousHashValid;
    
    return {
      isValid,
      isModified,
      hashValid: isModified ? false : hashValid,
      previousHashValid
    };
  };

  const handleDataChange = (index, newData) => {
    setEditedData(prev => ({
      ...prev,
      [index]: newData
    }));
    setIsChainValid(false);
  };

  const handleSaveEdit = (index) => {
    const newData = editedData[index];
    if (newData !== undefined) {
      const block = blockchainRef.current.chain[index];
      
      if (newData === originalData[index]) {
        block.data = newData;
        block.hash = originalHashes[index];
        block.nonce = originalNonces[index];
      } else {
        block.data = newData;
        block.hash = block.calculateHash();
      }
      
      setBlocks([...blockchainRef.current.chain]);
      
      let allBlocksMatchOriginal = true;
      for (let i = 0; i < blockchainRef.current.chain.length; i++) {
        const currentData = blockchainRef.current.chain[i].data;
        if (currentData !== originalData[i]) {
          allBlocksMatchOriginal = false;
          break;
        }
      }
      
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
    setEditedData(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    
    let allBlocksMatchOriginal = true;
    for (let i = 0; i < blockchainRef.current.chain.length; i++) {
      const currentData = blockchainRef.current.chain[i].data;
      if (currentData !== originalData[i]) {
        allBlocksMatchOriginal = false;
        break;
      }
    }
    
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

  // Update blockchain difficulty when state changes
  useEffect(() => {
    blockchainRef.current.updateDifficulty(difficulty);
  }, [difficulty]);

  const allBlocks = pendingBlock 
    ? [...blocks, pendingBlock] 
    : blocks;

  return (
    <div className="app">
      <h1>Blockchain Visualizer</h1>
      
      <Controls
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        dataInput={dataInput}
        setDataInput={setDataInput}
        isMining={isMining}
        handleMineClick={handleMineClick}
        pendingBlock={pendingBlock}
      />
      
      <ValidationIndicator isChainValid={isChainValid} />
      
      <div className="blockchain-section">
        <h2>Blockchain ({blocks.length} blocks {isMining ? '+ 1 mining' : ''})</h2>
        <div className="blocks-container">
          {allBlocks.map((block, index) => {
            const validationStatus = getBlockValidationStatus(block, index);
            const currentData = editedData[index] !== undefined ? editedData[index] : block.data;
            const isEdited = editedData[index] !== undefined;
            
            return (
              <React.Fragment key={block.hash || `pending-${block.index}`}>
                <BlockCard
                  block={block}
                  index={index}
                  isEdited={isEdited}
                  editingBlock={editingBlock}
                  pendingBlock={pendingBlock}
                  validationStatus={validationStatus}
                  isMining={isMining}
                  allBlocks={allBlocks}
                  currentData={currentData}
                  onDataChange={handleDataChange}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onStartEdit={setEditingBlock}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;