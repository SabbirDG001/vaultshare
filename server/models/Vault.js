const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema(
  {
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    originalName: {
      type: String,
      required: true,
    },
    encryptedFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    encryptedKey: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    passphraseHash: {
      type: String,
      default: null,
    },
    hasPassphrase: {
      type: Boolean,
      default: false,
    },
    linkToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    maxDownloads: {
      type: Number,
      default: 1,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'burned'],
      default: 'active',
    },
  },
  { timestamps: true }
);

vaultSchema.index({ expiryDate: 1 });
vaultSchema.index({ linkToken: 1 });
vaultSchema.index({ uploaderId: 1 });

module.exports = mongoose.model('Vault', vaultSchema);