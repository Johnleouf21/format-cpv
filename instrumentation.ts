export async function register() {
  const { setupLogger } = await import('@/lib/logger')
  setupLogger()
}