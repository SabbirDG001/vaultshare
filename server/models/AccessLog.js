const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    vaultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vault',
      required: true,
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    action: {
      type: String,
      enum: ['view', 'download', 'failed_passphrase'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

accessLogSchema.index({ vaultId: 1 });
accessLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);