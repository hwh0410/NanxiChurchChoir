export const sampleSchedules = [
  {
    id: "sch-001",
    date: "2026-05-10",
    title: "主日禮拜",
    serviceType: "主日",
    note: "母親節主日",
    songs: [
      {
        id: "song-001",
        title: "奇異恩典",
        usageType: "獻詩",
      },
      {
        id: "song-002",
        title: "祢真偉大",
        usageType: "回應詩",
      },
    ],
  },
];

export const sampleSongs = [
  {
    id: "song-001",
    title: "奇異恩典",
    key: "G",
    tempo: "72",
    note: "注意第二段進副歌的呼吸。",
    resources: [
      {
        id: "res-001",
        type: "youtube",
        voicePart: "全體",
        title: "全曲示範",
        url: "https://www.youtube.com/watch?v=CDdvReNKKuk",
      },
      {
        id: "res-002",
        type: "score",
        voicePart: "全體",
        title: "樂譜PDF",
        url: "",
      },
    ],
  },
  {
    id: "song-002",
    title: "祢真偉大",
    key: "D",
    tempo: "80",
    note: "結尾漸強，注意音準。",
    resources: [],
  },
];

export const sampleArchiveVideos = [
  {
    id: "vid-001",
    title: "奇異恩典",
    date: "2025-12-21",
    eventName: "聖誕主日",
    youtubeUrl: "https://www.youtube.com/watch?v=CDdvReNKKuk",
    description: "聖誕節獻詩紀錄。",
    tags: "聖誕,獻詩",
  },
];