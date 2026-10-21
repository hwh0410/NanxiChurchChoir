import { getGoogleCredential } from "./googleAuth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nanxichurchlinebot.onrender.com";

// Revision token lives only in memory and is reset on every fresh read.
let latestVersion = null;

export const emptyData = {
  schedules: [],
  songs: [],
  archiveVideos: [],
};

function getAccessToken() {
  const token = getGoogleCredential();
  if (!token) throw new Error("Google 登入已失效，請重新登入。");
  return token;
}
function normalizeData(data) {
  return {
    schedules: Array.isArray(data?.schedules) ? data.schedules : [],
    songs: Array.isArray(data?.songs) ? data.songs : [],
    archiveVideos: Array.isArray(data?.archiveVideos) ? data.archiveVideos : [],
  };
}
async function parseApiResponse(response) {
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      result?.message || result?.error || `API request failed with status ${response.status}`
    );
    error.code = result?.code || "API_ERROR";
    error.status = response.status;
    error.currentVersion = result?.currentVersion || null;
    throw error;
  }
  return result;
}

export async function loadDataWithStatus() {
  // Prefer fresh, revision-tagged data for safe writes.
  const v2Response = await fetch(`${API_BASE_URL}/api/data/v2`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  let result;
  if (v2Response.status === 404) {
    // A read-only staging preview can use the current production v1 backend.
    // It must not enable writes until the new v2 backend is deployed.
    const legacy = await fetch(`${API_BASE_URL}/api/data`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    result = await parseApiResponse(legacy);
    latestVersion = null;
  } else {
    result = await parseApiResponse(v2Response);
    latestVersion = result.version || null;
  }
  return {
    data: normalizeData(result.data),
    cache: result.cache || null,
    version: latestVersion,
    supportsVersionedWrites: Boolean(latestVersion),
  };
}
export async function loadData() {
  const result = await loadDataWithStatus();
  return result.data;
}
export async function getCloudStatus() {
  const response = await fetch(`${API_BASE_URL}/cache-info`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return parseApiResponse(response);
}
export async function saveData(data) {
  if (import.meta.env.VITE_READ_ONLY_PREVIEW === "true") {
    throw new Error("設計預覽模式為唯讀，無法修改正式資料。");
  }
  if (!latestVersion) {
    const error = new Error(
      "管理後端尚未啟用資料版本保護。為避免覆蓋其他管理員的更新，暫時停止儲存。"
    );
    error.code = "VERSION_REQUIRED";
    throw error;
  }
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/data/v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ version: latestVersion, data: normalizeData(data) }),
  });
  const result = await parseApiResponse(response);
  if (!result.version) {
    throw new Error("後端未回傳資料版本，請重新載入以確認是否儲存成功。");
  }
  latestVersion = result.version;
  return result;
}
export async function resetData() {
  const result = await saveData(emptyData);
  return { data: result.data, cache: result.cache || null };
}
