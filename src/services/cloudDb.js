import { getGoogleCredential, clearGoogleCredential } from "./googleAuth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nanxichurchlinebot.onrender.com";

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
    archiveVideos: Array.isArray(data?.archiveVideos)
      ? data.archiveVideos
      : [],
  };
}

async function parseApiResponse(response) {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return result;
}

export async function loadDataWithStatus() {
  const response = await fetch(`${API_BASE_URL}/api/data`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const result = await parseApiResponse(response);

  return {
    data: normalizeData(result.data),
    cache: result.cache || null,
  };
}

export async function loadData() {
  const result = await loadDataWithStatus();
  return result.data;
}

export async function getCloudStatus() {
  const response = await fetch(`${API_BASE_URL}/cache-info`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return parseApiResponse(response);
}

export async function saveData(data) {
  // A design preview can read public choir data but must never modify Sheets.
  if (import.meta.env.VITE_READ_ONLY_PREVIEW === "true") {
    throw new Error("設計預覽模式為唯讀，無法修改正式資料。");
  }
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(normalizeData(data)),
  });

  return parseApiResponse(response);
}

export async function resetData() {
  const data = emptyData;
  const result = await saveData(data);

  return {
    data,
    cache: result.cache || null,
  };
}
