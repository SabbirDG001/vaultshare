const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const User = require('./models/User');
const Vault = require('./models/Vault');
const AccessLog = require('./models/AccessLog');
const { encryptFile, generateEncryptedFileName } = require('./utils/encryption');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // ── Clean existing demo data ─────────────────────────────────────────────
    await User.deleteMany({ email: { $in: ['admin@vaultshare.com', 'demo@vaultshare.com'] } });
    console.log('Cleared existing demo users');

    // ── Create admin user ────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@vaultshare.com',
      passwordHash: adminHash,
      role: 'admin',
    });
    console.log('Admin created:', admin.email);

    // ── Create demo user ─────────────────────────────────────────────────────
    const demoHash = await bcrypt.hash('demo123', 12);
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@vaultshare.com',
      passwordHash: demoHash,
      role: 'user',
    });
    console.log('Demo user created:', demoUser.email);

    // ── Helper: create a real encrypted file ─────────────────────────────────
    const createEncryptedVault = (content, fileName) => {
      const tempPath = path.join(UPLOADS_DIR, `temp_seed_${Date.now()}.txt`);
      const encFileName = generateEncryptedFileName(fileName);
      const encPath = path.join(UPLOADS_DIR, encFileName);

      fs.writeFileSync(tempPath, content);
      const result = encryptFile(tempPath, encPath);
      fs.unlinkSync(tempPath);

      return { encFileName, encPath, result };
    };

    // ── Vault 1: Active vault ────────────────────────────────────────────────
    const v1 = createEncryptedVault(
      'This is a demo active vault file.\nIt contains sensitive project credentials.\nAPI_KEY=demo_key_12345\nDB_PASSWORD=supersecret',
      'project-credentials.txt'
    );

    const activeVault = await Vault.create({
      uploaderId: demoUser._id,
      originalName: 'project-credentials.txt',
      encryptedFileName: v1.encFileName,
      filePath: v1.encPath,
      fileSize: 120,
      mimeType: 'text/plain',
      encryptedKey: v1.result.encryptedKey,
      iv: v1.result.iv,
      salt: v1.result.salt,
      passphraseHash: null,
      hasPassphrase: false,
      linkToken: uuidv4(),
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      maxDownloads: 3,
      downloadCount: 1,
      status: 'active',
    });

    await AccessLog.create([
      {
        vaultId: activeVault._id,
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        action: 'view',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        vaultId: activeVault._id,
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        action: 'download',
        timestamp: new Date(Date.now() - 55 * 60 * 1000),
      },
    ]);
    console.log('Active vault created:', activeVault.originalName);

    // ── Vault 2: Passphrase-protected active vault ───────────────────────────
    const passphraseHash = await bcrypt.hash('secret123', 12);
    const v2 = createEncryptedVault(
      'This is a passphrase-protected vault.\nOnly the recipient with the correct passphrase can access this.',
      'confidential-report.txt'
    );

    const protectedVault = await Vault.create({
      uploaderId: demoUser._id,
      originalName: 'confidential-report.txt',
      encryptedFileName: v2.encFileName,
      filePath: v2.encPath,
      fileSize: 98,
      mimeType: 'text/plain',
      encryptedKey: v2.result.encryptedKey,
      iv: v2.result.iv,
      salt: v2.result.salt,
      passphraseHash,
      hasPassphrase: true,
      linkToken: uuidv4(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxDownloads: 1,
      downloadCount: 0,
      status: 'active',
    });

    await AccessLog.create([
      {
        vaultId: protectedVault._id,
        ip: '10.0.0.55',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) Safari/604.1',
        action: 'view',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        vaultId: protectedVault._id,
        ip: '10.0.0.55',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) Safari/604.1',
        action: 'failed_passphrase',
        timestamp: new Date(Date.now() - 29 * 60 * 1000),
      },
    ]);
    console.log('Protected vault created:', protectedVault.originalName);

    // ── Vault 3: Burned vault ────────────────────────────────────────────────
    const burnedVault = await Vault.create({
      uploaderId: demoUser._id,
      originalName: 'one-time-secret.txt',
      encryptedFileName: 'already_deleted.enc',
      filePath: path.join(UPLOADS_DIR, 'already_deleted.enc'),
      fileSize: 64,
      mimeType: 'text/plain',
      encryptedKey: 'deleted',
      iv: 'deleted',
      salt: 'deleted',
      passphraseHash: null,
      hasPassphrase: false,
      linkToken: uuidv4(),
      expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      maxDownloads: 1,
      downloadCount: 1,
      status: 'burned',
    });

    await AccessLog.create([
      {
        vaultId: burnedVault._id,
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
        action: 'view',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        vaultId: burnedVault._id,
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
        action: 'download',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
      },
    ]);
    console.log('Burned vault created:', burnedVault.originalName);

    // ── Vault 4: Expired vault ───────────────────────────────────────────────
    const expiredVault = await Vault.create({
      uploaderId: demoUser._id,
      originalName: 'expired-document.pdf',
      encryptedFileName: 'expired_deleted.enc',
      filePath: path.join(UPLOADS_DIR, 'expired_deleted.enc'),
      fileSize: 245000,
      mimeType: 'application/pdf',
      encryptedKey: 'deleted',
      iv: 'deleted',
      salt: 'deleted',
      passphraseHash: null,
      hasPassphrase: false,
      linkToken: uuidv4(),
      expiryDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
      maxDownloads: 5,
      downloadCount: 0,
      status: 'expired',
    });
    console.log('Expired vault created:', expiredVault.originalName);

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n========================================');
    console.log('  SEED COMPLETE — Demo accounts ready');
    console.log('========================================');
    console.log('\n  Admin account:');
    console.log('  Email:    admin@vaultshare.com');
    console.log('  Password: admin123');
    console.log('\n  Demo user account:');
    console.log('  Email:    demo@vaultshare.com');
    console.log('  Password: demo123');
    console.log('\n  Vaults created:');
    console.log('  1. project-credentials.txt  → Active (1/3 downloads used)');
    console.log('  2. confidential-report.txt  → Active, passphrase: secret123');
    console.log('  3. one-time-secret.txt      → Burned (self-destructed)');
    console.log('  4. expired-document.pdf     → Expired (time ran out)');
    console.log('\n  Active vault links:');
    console.log(`  Vault 1: http://localhost:5173/vault/${activeVault.linkToken}`);
    console.log(`  Vault 2: http://localhost:5173/vault/${protectedVault.linkToken}`);
    console.log(`  Vault 3: http://localhost:5173/vault/${burnedVault.linkToken}`);
    console.log('========================================\n');

    mongoose.disconnect();

  } catch (error) {
    console.error('Seed failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

seed();