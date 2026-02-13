import SHA256 from 'crypto-js/sha256';

export class Block {
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


  //mines the block, finding its nonce, hash and time elapsed
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
