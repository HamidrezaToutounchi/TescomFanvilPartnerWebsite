'use strict';

const { Lead, MailSettings, MailRecipient, MailJob } = require('./models');
const {
  isMailSettingsConfigured,
  sendMailWithSettings,
  buildLeadNotificationContent
} = require('./mailer');

// Backoff delays in minutes for attempts 1, 2, 3, 4, 5
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];
const MAX_ATTEMPTS = 5;
const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes

let workerInterval = null;
let isProcessingBatch = false;

async function enqueueLeadMailJob(leadId) {
  try {
    const job = await MailJob.create({
      leadId,
      status: 'pending',
      attempts: 0,
      lastError: '',
      nextAttemptAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    // Trigger non-blocking immediate check
    setImmediate(() => {
      processDueMailJobs().catch((err) =>
        console.error('[WARN] Outbox immediate trigger error:', err.message)
      );
    });
    return job;
  } catch (err) {
    console.error('[ERROR] Failed to enqueue mail job for lead:', leadId, err.message);
    return null;
  }
}

async function processSingleJob(job) {
  const lead = await Lead.findById(job.leadId).lean();
  if (!lead) {
    await MailJob.findByIdAndUpdate(job._id, {
      $set: {
        status: 'skipped',
        lastError: 'İlgili lead kaydı bulunamadı.',
        lockedAt: null,
        updatedAt: new Date()
      }
    });
    return;
  }

  const settingsDoc = await MailSettings.findOne({ key: 'default' }).lean();
  if (!isMailSettingsConfigured(settingsDoc)) {
    await MailJob.findByIdAndUpdate(job._id, {
      $set: {
        status: 'skipped',
        lastError: 'Mail gönderim ayarları henüz tanımlanmamış.',
        lockedAt: null,
        updatedAt: new Date()
      }
    });
    return;
  }

  const activeRecipients = await MailRecipient.find({ active: true }).lean();
  const matchingRecipients = activeRecipients.filter((r) => {
    if (!Array.isArray(r.requestTypes) || r.requestTypes.length === 0) {
      return true;
    }
    return r.requestTypes.includes(lead.requestType);
  });

  if (matchingRecipients.length === 0) {
    await MailJob.findByIdAndUpdate(job._id, {
      $set: {
        status: 'skipped',
        lastError: 'Bu talep tipi için aktif alıcı e-posta adresi bulunmuyor.',
        lockedAt: null,
        updatedAt: new Date()
      }
    });
    return;
  }

  const toAddresses = matchingRecipients.map((r) => r.email);
  const { subject, text, html, replyTo } = buildLeadNotificationContent(lead);

  try {
    await sendMailWithSettings(settingsDoc, {
      toAddresses,
      subject,
      text,
      html,
      replyTo
    });

    await MailJob.findByIdAndUpdate(job._id, {
      $set: {
        status: 'sent',
        attempts: job.attempts + 1,
        lastError: '',
        sentAt: new Date(),
        lockedAt: null,
        updatedAt: new Date()
      }
    });
  } catch (err) {
    const attemptNum = job.attempts + 1;
    const errorMsg = String(err?.message || err).slice(0, 1500);

    if (attemptNum >= MAX_ATTEMPTS) {
      await MailJob.findByIdAndUpdate(job._id, {
        $set: {
          status: 'failed',
          attempts: attemptNum,
          lastError: errorMsg,
          lockedAt: null,
          updatedAt: new Date()
        }
      });
      return;
    }

    const defaultBackoffSec =
      (BACKOFF_MINUTES[attemptNum - 1] || BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1]) * 60;
    const retryAfterSec =
      err?.retryAfterSeconds && err.retryAfterSeconds > defaultBackoffSec
        ? err.retryAfterSeconds
        : defaultBackoffSec;

    const nextAttemptAt = new Date(Date.now() + retryAfterSec * 1000);

    await MailJob.findByIdAndUpdate(job._id, {
      $set: {
        status: 'pending',
        attempts: attemptNum,
        lastError: errorMsg,
        nextAttemptAt,
        lockedAt: null,
        updatedAt: new Date()
      }
    });
  }
}

async function processDueMailJobs() {
  if (isProcessingBatch) return;
  isProcessingBatch = true;

  try {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - STALE_LOCK_MS);

    // Process up to 10 due jobs per cycle, locking each atomically with findOneAndUpdate
    for (let i = 0; i < 10; i += 1) {
      const claimedJob = await MailJob.findOneAndUpdate(
        {
          $or: [
            { status: 'pending', nextAttemptAt: { $lte: now } },
            { status: 'processing', lockedAt: { $lte: staleThreshold } }
          ]
        },
        {
          $set: {
            status: 'processing',
            lockedAt: new Date(),
            updatedAt: new Date()
          }
        },
        {
          sort: { nextAttemptAt: 1 },
          new: true
        }
      );

      if (!claimedJob) {
        break;
      }

      await processSingleJob(claimedJob);
    }
  } catch (err) {
    console.error('[ERROR] Outbox worker cycle error:', err.message);
  } finally {
    isProcessingBatch = false;
  }
}

function startOutboxWorker() {
  if (workerInterval) return;
  workerInterval = setInterval(() => {
    processDueMailJobs();
  }, 30 * 1000);
  workerInterval.unref();
  // Initial check 5 seconds after boot
  setTimeout(() => {
    processDueMailJobs();
  }, 5000).unref();
}

function stopOutboxWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

module.exports = {
  enqueueLeadMailJob,
  processDueMailJobs,
  startOutboxWorker,
  stopOutboxWorker
};
