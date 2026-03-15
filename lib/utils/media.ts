/**
 * Transform a video URL into an embeddable URL.
 * Handles YouTube, Vimeo, and passes through SharePoint embed URLs as-is.
 */
export function getVideoEmbedUrl(url: string): string {
  if (!url) return ''

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  // Uses nocookie domain (no tracking) + rel=0 (no unrelated suggestions) + modestbranding (less branding)
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  // Direct video URL or any other URL — use as-is
  return url
}

/**
 * Check if a video URL can be embedded in an iframe.
 * SharePoint/OneDrive links block iframes via frame-ancestors — they open in a new tab instead.
 */
export function isEmbeddableVideo(url: string): boolean {
  if (!url) return false
  // YouTube and Vimeo support iframe embedding
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return true
  if (/vimeo\.com\/\d+/.test(url)) return true
  // SharePoint/OneDrive block iframe embedding
  if (/\.sharepoint\.com/.test(url)) return false
  // Direct video files can be embedded
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return true
  // Unknown — try iframe
  return true
}

/**
 * Check if a URL points to a video resource.
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false
  // SharePoint video share link pattern /:v:/
  if (/\.sharepoint\.com\/:v:\//.test(url)) return true
  // YouTube
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return true
  // Vimeo
  if (/vimeo\.com\/\d+/.test(url)) return true
  // Direct video file extensions
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return true
  // SharePoint embed.aspx (video)
  if (/embed\.aspx/i.test(url)) return true
  return false
}
