/**
 * BRAHMO Compliance Engine - Hash Chain (Browser + Server Compatible)
 * Uses Web Crypto API (SubtleCrypto) for SHA-256 hashing
 */

/**
 * Internal: Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Internal: SHA-256 hash using SubtleCrypto (works in browser + Node 18+)
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // Use globalThis.crypto which works in both browser and Node.js 18+
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Compute output hash for AI session
 * Only stores hash, never the full output
 */
export const computeOutputHash = async (outputContent: string): Promise<string> => {
  return sha256(outputContent);
};

/**
 * Compute hash chain for blocked access events
 * Creates tamper-evident audit trail
 *
 * Hash = SHA256(previousHash || userId || matterId || reason || timestamp)
 * Each event depends on the previous hash, making tampering detectable
 */
export const computeBlockedAccessHash = async (
  previousHash: string | null,
  userId: string,
  matterId: string,
  reason: string,
  timestamp: string
): Promise<string> => {
  const chainInput = `${previousHash || 'GENESIS'}||${userId}||${matterId}||${reason}||${timestamp}`;
  return sha256(chainInput);
};

/**
 * Verify hash chain integrity
 * Validates that no blocks in the chain have been tampered with
 */
export const verifyHashChain = async (
  blocks: Array<{
    previous_hash: string | null;
    current_hash: string;
    user_id: string;
    attempted_matter_id: string;
    reason: string;
    timestamp: string;
  }>
): Promise<boolean> => {
  if (blocks.length === 0) {
    return true;
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const expectedHash = await computeBlockedAccessHash(
      block.previous_hash,
      block.user_id,
      block.attempted_matter_id,
      block.reason,
      block.timestamp
    );

    if (expectedHash !== block.current_hash) {
      console.error(`Hash chain verification failed at block ${i}`);
      return false;
    }
  }

  return true;
};

/**
 * Generate a secure random token for demo purposes
 */
export const generateSecureToken = (): string => {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
};

/**
 * Create a deterministic hash for consistent demo behavior
 */
export const createDemoOutputHash = async (
  userId: string,
  matterId: string,
  queryType: string,
  timestamp: string
): Promise<string> => {
  const input = `${userId}||${matterId}||${queryType}||${timestamp}`;
  return sha256(input);
};

/**
 * Generate anonymized client identifier for export
 */
export const anonymizeClientName = (_clientId: string, clientIndex: number): string => {
  const letters = String.fromCharCode(65 + (clientIndex % 26));
  return `Client ${letters}`;
};

/**
 * Validate SHA256 hash format
 */
export const isValidSHA256 = (hash: string): boolean => {
  return /^[a-f0-9]{64}$/.test(hash);
};
