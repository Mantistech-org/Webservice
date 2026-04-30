let cronStarted = false

export function startCronScheduler() {
  if (cronStarted) return
  cronStarted = true

  console.log('[cron] scheduler started')

  // Run campaign emails every hour
  setInterval(async () => {
    try {
      console.log('[cron] running campaign-emails')
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cron/campaign-emails`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
      })
      const data = await res.json()
      console.log('[cron] campaign-emails result:', data)
    } catch (err) {
      console.error('[cron] campaign-emails failed:', err)
    }
  }, 60 * 60 * 1000) // every hour

  // Run immediately on startup
  setTimeout(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cron/campaign-emails`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
      })
      const data = await res.json()
      console.log('[cron] initial run result:', data)
    } catch (err) {
      console.error('[cron] initial run failed:', err)
    }
  }, 5000) // 5 seconds after startup
}
