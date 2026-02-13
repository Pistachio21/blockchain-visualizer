import { Block } from './Block';


export class Blockchain {
  constructor(difficulty = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }


  //creates the genesis block
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

  //checks chain validity
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

  //updates the block data if modified
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
