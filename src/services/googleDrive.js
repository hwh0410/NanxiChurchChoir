export function getGoogleDriveFileId(url) {
  if (!url) return "";

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    return match[1];
  }

  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  return "";
}

export function getGoogleDrivePreviewUrl(url) {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${fileId}/preview`;
}