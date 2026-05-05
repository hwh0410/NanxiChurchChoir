import {
  sampleSchedules,
  sampleSongs,
  sampleArchiveVideos,
} from "../data/sampleData";

const STORAGE_KEY = "choir-scheduler-data";

// 建立初始資料
function createInitialData() {
  return {
    schedules: sampleSchedules,
    songs: sampleSongs,
    archiveVideos: sampleArchiveVideos,
  };
}

// 讀取資料（不覆蓋已存在資料）
export function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const initialData = createInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    console.log("初始化資料寫入 localStorage");
    return initialData;
  }

  try {
    const parsed = JSON.parse(saved);
    console.log("成功從 localStorage 讀取資料");
    return parsed;
  } catch (error) {
    console.error("資料壞掉，重新初始化", error);
    const initialData = createInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
}

// 寫入資料
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log("資料已儲存");
}

// 重設資料
export function resetData() {
  const initialData = createInitialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
}