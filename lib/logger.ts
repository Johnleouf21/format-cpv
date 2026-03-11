const isDev = process.env.NODE_ENV === 'development'

const originalConsole = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
}

export function setupLogger() {
  if (!isDev) {
    console.log = () => {}
    console.warn = () => {}
    console.info = () => {}
    console.debug = () => {}
    // console.error reste intact — on veut toujours voir les erreurs
  }
}

// Pour un usage manuel si besoin
export const logger = {
  log: (...args: unknown[]) => originalConsole.log(...args),
  warn: (...args: unknown[]) => originalConsole.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
}