/**
 * Transform a video URL into an embeddable URL.
 * Handles YouTube, Vimeo, and passes through SharePoint embed URLs as-is.
 */
export function getVideoEmbedUrl(url: string): string {
  if (!url) return ''

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  // SharePoint embed, direct video URL, or any other URL — use as-is
  return url
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
