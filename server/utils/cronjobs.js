const cron = require('node-cron');
const fs = require('fs');
const Vault = require('../models/Vault');

const startCronJobs = () => {
  console.log('Cron jobs initialized');

  // ── Runs every 15 minutes ──────────────────────────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    console.log(`[Cron] Running expiry sweep at ${new Date().toISOString()}`);

    try {
      // Find all vaults that are expired by time
      const expiredByTime = await Vault.find({
        status: 'active',
        expiryDate: { $lte: new Date() },
      });

      // Find all vaults that hit their download limit
      const expiredByDownloads = await Vault.find({
        status: 'active',
        $expr: { $gte: ['$downloadCount', '$maxDownloads'] },
      });

      const allExpired = [...expiredByTime, ...expiredByDownloads];

      if (allExpired.length === 0) {
        console.log('[Cron] No expired vaults found');
        return;
      }

      console.log(`[Cron] Found ${allExpired.length} vault(s) to sweep`);

      let deletedFiles = 0;
      let failedFiles = 0;

      for (const vault of allExpired) {
        try {
          // Delete encrypted file from disk
          if (vault.filePath && fs.existsSync(vault.filePath)) {
            fs.unlinkSync(vault.filePath);
            deletedFiles++;
          }

          // Mark vault status
          vault.status = expiredByTime.includes(vault) ? 'expired' : 'burned';
          await vault.save();

        } catch (fileError) {
          console.error(`[Cron] Failed to delete file for vault ${vault._id}:`, fileError.message);
          failedFiles++;
        }
      }

      console.log(`[Cron] Sweep complete — deleted: ${deletedFiles}, failed: ${failedFiles}`);

    } catch (error) {
      console.error('[Cron] Sweep error:', error.message);
    }
  });
};

module.exports = { startCronJobs };