const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Vault = require('../models/Vault');
const AccessLog = require('../models/AccessLog');

const router = express.Router();

const adminOnly = [authMiddleware, roleMiddleware('admin')];

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVaults = await Vault.countDocuments();
    const activeVaults = await Vault.countDocuments({ status: 'active' });
    const burnedVaults = await Vault.countDocuments({ status: 'burned' });
    const totalDownloads = await AccessLog.countDocuments({ action: 'download' });
    const failedAttempts = await AccessLog.countDocuments({ action: 'failed_passphrase' });

    const vaults = await Vault.find().select('fileSize');
    const totalStorage = vaults.reduce((sum, v) => sum + (v.fileSize || 0), 0);

    res.json({
      totalUsers,
      totalVaults,
      activeVaults,
      burnedVaults,
      totalDownloads,
      failedAttempts,
      totalStorage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash -apiKey')
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const vaultCount = await Vault.countDocuments({ uploaderId: user._id });
        return { ...user.toObject(), vaultCount };
      })
    );

    res.json({ users: usersWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ─── PATCH /api/admin/users/:id/ban ──────────────────────────────────────────
router.patch('/users/:id/ban', adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot ban yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      message: user.isBanned ? 'User banned' : 'User unbanned',
      isBanned: user.isBanned,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user ban status' });
  }
});

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
router.patch('/users/:id/role', adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

// ─── GET /api/admin/vaults ────────────────────────────────────────────────────
router.get('/vaults', adminOnly, async (req, res) => {
  try {
    const vaults = await Vault.find()
      .sort({ createdAt: -1 })
      .select('-encryptedKey -iv -salt -passphraseHash')
      .populate('uploaderId', 'name email');

    res.json({ vaults });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vaults' });
  }
});

// ─── DELETE /api/admin/vaults/:id ────────────────────────────────────────────
router.delete('/vaults/:id', adminOnly, async (req, res) => {
  try {
    const vault = await Vault.findById(req.params.id);

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (fs.existsSync(vault.filePath)) {
      fs.unlinkSync(vault.filePath);
    }

    await Vault.findByIdAndDelete(req.params.id);
    await AccessLog.deleteMany({ vaultId: req.params.id });

    res.json({ message: 'Vault permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vault' });
  }
});

// ─── GET /api/admin/logs ──────────────────────────────────────────────────────
router.get('/logs', adminOnly, async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('vaultId', 'originalName');

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

module.exports = router;