module.exports = {
  apps: [
    {
      name: 'PaymentListener',
      script: './functions/listener.js',
      watch: true,
      autorestart: true,
      max_memory_restart: '300M',
      cron_restart: '*/5 * * * *',
    },
    {
      name: 'CronMintPT',
      script: './functions/mintPT.js',
      // watch: true,
      autorestart: false,
      max_memory_restart: '300M',
      cron_restart: '*/1 * * * *',
    },
  ],
}
