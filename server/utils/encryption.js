const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha512';

const deriveKey = (secret, salt) => {
  return crypto.pbkdf2Sync(
    secret,
    Buffer.from(salt, 'hex'),
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
};

const encryptFile = (inputPath, outputPath, passphrase = null) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const secret = passphrase
      ? passphrase
      : process.env.ENCRYPTION_SECRET;

    const key = deriveKey(secret, salt.toString('hex'));

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const inputBuffer = fs.readFileSync(inputPath);
    const encryptedBuffer = Buffer.concat([
      cipher.update(inputBuffer),
      cipher.final(),
    ]);

    fs.writeFileSync(outputPath, encryptedBuffer);

    return {
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      encryptedKey: key.toString('hex'),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

const decryptFile = (inputPath, outputPath, encryptedKey, iv, salt, passphrase = null) => {
  try {
    let key;

    if (passphrase) {
      key = deriveKey(passphrase, salt);
    } else {
      key = Buffer.from(encryptedKey, 'hex');
    }

    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);

    const encryptedBuffer = fs.readFileSync(inputPath);
    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    fs.writeFileSync(outputPath, decryptedBuffer);

    return true;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

const generateEncryptedFileName = (originalName) => {
  const ext = path.extname(originalName);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}.enc`;
};

module.exports = { encryptFile, decryptFile, generateEncryptedFileName };