export function getYoutubeId(url) {
  if (!url) return "";

  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return "";
}

export function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function getYoutubeEmbedUrl(url) {
  const id = getYoutubeId(url);
  if (!id) return "";
  return `https://www.youtube.com/embed/${id}`;
}