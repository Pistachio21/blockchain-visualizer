import SHA256 from 'crypto-js/sha256';

export function calculateBlockHash(index, timestamp, data, previousHash, nonce) {
  return SHA256(
    index +
    previousHash +
    timestamp +
    data +
    nonce
  ).toString();
}

export function formatTimestamp(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString();
}

export function truncateHash(hash) {
  return hash.length > 10 ? hash.substring(0, 10) + '...' : hash;
}
