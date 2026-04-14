const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');
const { encryptFile, decryptFile, generateEncryptedFileName } = require('../utils/encryption');
const Vault = require('../models/Vault');
const AccessLog = require('../models/AccessLog');
const { passphraseRateLimiter, uploadRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ─── Helper: calculate expiry date ───────────────────────────────────────────
const calculateExpiryDate = (duration) => {
  const now = new Date();
  const map = {
    '1h':  60 * 60 * 1000,
    '6h':  6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d':  7 * 24 * 60 * 60 * 1000,
  };
  const ms = map[duration] || map['24h'];
  return new Date(now.getTime() + ms);
};

// ─── POST /api/vault/upload ───────────────────────────────────────────────────
router.post('/upload', authMiddleware, uploadRateLimiter, upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  let encryptedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { passphrase, duration, maxDownloads } = req.body;

    tempFilePath = req.file.path;

    const encryptedFileName = generateEncryptedFileName(req.file.originalname);
    encryptedFilePath = path.join(__dirname, '../uploads/', encryptedFileName);

    const encryptionResult = encryptFile(
      tempFilePath,
      encryptedFilePath,
      passphrase || null
    );

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    }

    let passphraseHash = null;
    if (passphrase && passphrase.trim() !== '') {
      passphraseHash = await bcrypt.hash(passphrase, 12);
    }

    const linkToken = uuidv4();
    const expiryDate = calculateExpiryDate(duration || '24h');
    const parsedMaxDownloads = parseInt(maxDownloads) || 1;

    const vault = await Vault.create({
      uploaderId: req.user._id,
      originalName: req.file.originalname,
      encryptedFileName,
      filePath: encryptedFilePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      encryptedKey: encryptionResult.encryptedKey,
      iv: encryptionResult.iv,
      salt: encryptionResult.salt,
      passphraseHash,
      hasPassphrase: !!passphraseHash,
      linkToken,
      expiryDate,
      maxDownloads: parsedMaxDownloads,
      downloadCount: 0,
      status: 'active',
    });

    res.status(201).json({
      message: 'File uploaded and encrypted successfully',
      linkToken: vault.linkToken,
      vaultId: vault._id,
      originalName: vault.originalName,
      expiryDate: vault.expiryDate,
      maxDownloads: vault.maxDownloads,
      hasPassphrase: vault.hasPassphrase,
    });

  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (encryptedFilePath && fs.existsSync(encryptedFilePath)) {
      fs.unlinkSync(encryptedFilePath);
    }
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
});

// ─── GET /api/vault/my-vaults ─────────────────────────────────────────────────
router.get('/my-vaults', authMiddleware, async (req, res) => {
  try {
    const vaults = await Vault.find({ uploaderId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-encryptedKey -iv -salt -passphraseHash -filePath');

    res.json({ vaults });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vaults' });
  }
});

// ─── GET /api/vault/stats ─────────────────────────────────────────────────────
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await Vault.countDocuments({ uploaderId: req.user._id });
    const active = await Vault.countDocuments({ uploaderId: req.user._id, status: 'active' });
    const burned = await Vault.countDocuments({ uploaderId: req.user._id, status: 'burned' });
    const expired = await Vault.countDocuments({ uploaderId: req.user._id, status: 'expired' });

    const logs = await AccessLog.aggregate([
      {
        $lookup: {
          from: 'vaults',
          localField: 'vaultId',
          foreignField: '_id',
          as: 'vault',
        },
      },
      { $unwind: '$vault' },
      {
        $match: {
          'vault.uploaderId': req.user._id,
          action: 'download',
        },
      },
      { $count: 'totalDownloads' },
    ]);

    const totalDownloads = logs[0]?.totalDownloads || 0;

    res.json({ total, active, burned, expired, totalDownloads });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── DELETE /api/vault/:id/burn ───────────────────────────────────────────────
router.delete('/:id/burn', authMiddleware, async (req, res) => {
  try {
    const vault = await Vault.findOne({
      _id: req.params.id,
      uploaderId: req.user._id,
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (vault.status !== 'active') {
      return res.status(400).json({ message: 'Vault is already burned or expired' });
    }

    if (fs.existsSync(vault.filePath)) {
      fs.unlinkSync(vault.filePath);
    }

    vault.status = 'burned';
    await vault.save();

    res.json({ message: 'Vault burned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to burn vault' });
  }
});

// ─── GET /api/vault/:token ────────────────────────────────────────────────────
router.get('/:token', passphraseRateLimiter, async (req, res) => {
  try {
    const vault = await Vault.findOne({ linkToken: req.params.token });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (vault.status !== 'active') {
      return res.status(410).json({ message: 'This vault has been destroyed' });
    }

    if (new Date() > vault.expiryDate) {
      vault.status = 'expired';
      await vault.save();
      return res.status(410).json({ message: 'This vault has expired' });
    }

    if (vault.downloadCount >= vault.maxDownloads) {
      vault.status = 'burned';
      await vault.save();
      return res.status(410).json({ message: 'This vault has been destroyed' });
    }

    await AccessLog.create({
      vaultId: vault._id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'view',
    });

    res.json({
      originalName: vault.originalName,
      fileSize: vault.fileSize,
      mimeType: vault.mimeType,
      expiryDate: vault.expiryDate,
      hasPassphrase: vault.hasPassphrase,
      maxDownloads: vault.maxDownloads,
      downloadCount: vault.downloadCount,
      status: vault.status,
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vault info' });
  }
});

// ─── POST /api/vault/:token/download ─────────────────────────────────────────
router.post('/:token/download', passphraseRateLimiter, async (req, res) => {
  let decryptedFilePath = null;

  try {
    const vault = await Vault.findOne({ linkToken: req.params.token });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (vault.status !== 'active') {
      return res.status(410).json({ message: 'This vault has been destroyed' });
    }

    if (new Date() > vault.expiryDate) {
      vault.status = 'expired';
      await vault.save();
      return res.status(410).json({ message: 'This vault has expired' });
    }

    if (vault.downloadCount >= vault.maxDownloads) {
      vault.status = 'burned';
      await vault.save();
      return res.status(410).json({ message: 'This vault has been destroyed' });
    }

    if (vault.hasPassphrase) {
      const { passphrase } = req.body;
      if (!passphrase) {
        await AccessLog.create({
          vaultId: vault._id,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          action: 'failed_passphrase',
        });
        return res.status(401).json({ message: 'Passphrase is required' });
      }

      const isMatch = await bcrypt.compare(passphrase, vault.passphraseHash);
      if (!isMatch) {
        await AccessLog.create({
          vaultId: vault._id,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          action: 'failed_passphrase',
        });
        return res.status(401).json({ message: 'Incorrect passphrase' });
      }
    }

    const decryptedFileName = `dec_${Date.now()}_${vault.originalName}`;
    decryptedFilePath = path.join(__dirname, '../uploads/', decryptedFileName);

    decryptFile(
      vault.filePath,
      decryptedFilePath,
      vault.encryptedKey,
      vault.iv,
      vault.salt,
      vault.hasPassphrase ? req.body.passphrase : null
    );

    await AccessLog.create({
      vaultId: vault._id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      action: 'download',
    });

    vault.downloadCount += 1;

    const shouldBurn = vault.downloadCount >= vault.maxDownloads;
    if (shouldBurn) {
      vault.status = 'burned';
    }
    await vault.save();

    res.setHeader('Content-Disposition', `attachment; filename="${vault.originalName}"`);
    res.setHeader('Content-Type', vault.mimeType);

    const fileStream = fs.createReadStream(decryptedFilePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      if (fs.existsSync(decryptedFilePath)) {
        fs.unlinkSync(decryptedFilePath);
      }
      if (shouldBurn && fs.existsSync(vault.filePath)) {
        fs.unlinkSync(vault.filePath);
      }
    });

    fileStream.on('error', () => {
      if (decryptedFilePath && fs.existsSync(decryptedFilePath)) {
        fs.unlinkSync(decryptedFilePath);
      }
    });

  } catch (error) {
    if (decryptedFilePath && fs.existsSync(decryptedFilePath)) {
      fs.unlinkSync(decryptedFilePath);
    }
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// ─── GET /api/vault/:vaultId/logs ────────────────────────────────────────────
router.get('/:vaultId/logs', authMiddleware, async (req, res) => {
  try {
    const vault = await Vault.findOne({
      _id: req.params.vaultId,
      uploaderId: req.user._id,
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    const logs = await AccessLog.find({ vaultId: vault._id })
      .sort({ timestamp: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

module.exports = router;