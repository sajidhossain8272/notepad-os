import crypto from 'crypto';

// Generate ED25519 keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

const pubRaw = publicKey.export({ type: 'spki', format: 'der' });
const privRaw = privateKey.export({ type: 'pkcs8', format: 'der' });

const rawPub = pubRaw.subarray(pubRaw.length - 32);
const rawPrivSeed = privRaw.subarray(privRaw.length - 32);

const keyId = crypto.randomBytes(8);

// Minisign Public Key
const minisignPubBin = Buffer.concat([
  Buffer.from([0x45, 0x64]), // 'Ed'
  keyId,
  rawPub
]);
const pubKeyBase64 = minisignPubBin.toString('base64');
const pubKeyFormatted = `untrusted comment: minisign public key: ${keyId.toString('hex').toUpperCase()}\n${pubKeyBase64}`;

// Minisign Unencrypted Secret Key (Password: "")
// Header: 2 bytes 'Ed', 2 bytes KDF algorithm (0 = unencrypted), 8 bytes KDF ops (0), 8 bytes KDF mem (0), 8 bytes salt (0)
// Key body: 8 bytes Key ID, 32 bytes secret seed, 32 bytes public key, 2 bytes checksum
const keyBody = Buffer.concat([keyId, rawPrivSeed, rawPub]);
// Simple checksum calculation (BLAKE2b or SHA256 first 2 bytes or 0)
const checksum = crypto.createHash('sha256').update(keyBody).digest().subarray(0, 2);

const minisignSecretBin = Buffer.concat([
  Buffer.from([0x45, 0x64]), // 'Ed'
  Buffer.from([0x00, 0x00]), // KDF: 0 (none)
  Buffer.alloc(8, 0),        // opslimit
  Buffer.alloc(8, 0),        // memlimit
  Buffer.alloc(8, 0),        // salt
  keyBody,
  checksum
]);

const secretKeyBase64 = minisignSecretBin.toString('base64');
const secretKeyFormatted = `untrusted comment: minisign secret key\n${secretKeyBase64}`;

console.log('PUBLIC_KEY:');
console.log(pubKeyFormatted);
console.log('\nPRIVATE_KEY:');
console.log(secretKeyFormatted);
