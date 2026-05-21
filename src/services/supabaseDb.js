import { supabase } from "./supabaseClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nanxichurchlinebot.onrender.com";

export const emptyData = {
  schedules: [],
  songs: [],
  archiveVideos: [],
};

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token || "";
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

export async function loadData() {
  const response = await fetch(`${API_BASE_URL}/api/data`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const result = await parseApiResponse(response);

  return normalizeData(result.data);
}

export async function saveData(data) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("尚未登入管理員帳號，無法儲存資料。");
  }

  const response = await fetch(`${API_BASE_URL}/api/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(normalizeData(data)),
  });

  await parseApiResponse(response);
}

export async function resetData() {
  const data = emptyData;
  await saveData(data);
  return data;
}
