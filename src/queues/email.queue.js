const { Queue, Worker } = require('bullmq');
const { env } = require('../config/env.config');
const { sendMail } = require('../utils/mailer');
const logger = require('../utils/logger');

const connection = { 
  host: env.REDIS_HOST, 
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD 
};

const emailQueue = new Queue('email', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

emailQueue.waitUntilReady().then(() => {
  logger.info('[BullMQ]: Connected to Redis Cloud');
  console.log('[BullMQ]: Connected to Redis Cloud');
});

const startEmailWorker = () => {
  const worker = new Worker(
    'email',
    async (job) => {
      const { to, subject, html } = job.data;
      await sendMail({ to, subject, html });
      const msg = `[EmailQueue] Job #${job.id} | To: ${to} | Subject: ${subject}`;
      console.log(msg);
      logger.info(msg);
    },
    { connection }
  );

  worker.on('active', (job) => {
    console.log(`[EmailQueue] Processing job #${job.id} | To: ${job.data.to}`);
  });

  worker.on('failed', (job, err) => {
    const msg = `[EmailQueue] Job #${job.id} failed: ${err.message}`;
    console.error(msg, err.stack);
    logger.error(`${msg} | Stack: ${err.stack}`);
  });

  return worker;
};

module.exports = { emailQueue, startEmailWorker };
