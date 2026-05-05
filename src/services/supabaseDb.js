import { supabase } from "./supabaseClient";

export const emptyData = {
  schedules: [],
  songs: [],
  archiveVideos: [],
};

function mapSong(row, resources) {
  return {
    id: row.id,
    title: row.title,
    key: row.song_key || "",
    tempo: row.tempo || "",
    note: row.note || "",
    resources: resources
      .filter((resource) => resource.song_id === row.id)
      .map((resource) => ({
        id: resource.id,
        songId: resource.song_id,
        type: resource.type,
        voicePart: resource.voice_part,
        title: resource.title,
        url: resource.url,
      })),
  };
}

function mapSchedule(row, scheduleSongs) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    serviceType: row.service_type || "主日",
    note: row.note || "",
    songs: scheduleSongs
      .filter((item) => item.schedule_id === row.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item) => ({
        id: item.song_id,
        title: item.title,
        usageType: item.usage_type || "獻詩",
      })),
  };
}

function mapArchiveVideo(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date || "",
    eventName: row.event_name || "",
    youtubeUrl: row.youtube_url,
    description: row.description || "",
    tags: row.tags || "",
  };
}

async function runQuery(query) {
  const { error } = await query;

  if (error) {
    throw error;
  }
}

export async function loadData() {
  const [
    songsResult,
    resourcesResult,
    schedulesResult,
    scheduleSongsResult,
    archiveVideosResult,
  ] = await Promise.all([
    supabase.from("songs").select("*").order("created_at", { ascending: false }),
    supabase
      .from("song_resources")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("schedules").select("*").order("date", { ascending: true }),
    supabase
      .from("schedule_songs")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("archive_videos")
      .select("*")
      .order("date", { ascending: false }),
  ]);

  const error =
    songsResult.error ||
    resourcesResult.error ||
    schedulesResult.error ||
    scheduleSongsResult.error ||
    archiveVideosResult.error;

  if (error) {
    throw error;
  }

  const resources = resourcesResult.data || [];
  const scheduleSongs = scheduleSongsResult.data || [];

  return {
    songs: (songsResult.data || []).map((song) => mapSong(song, resources)),
    schedules: (schedulesResult.data || []).map((schedule) =>
      mapSchedule(schedule, scheduleSongs)
    ),
    archiveVideos: (archiveVideosResult.data || []).map(mapArchiveVideo),
  };
}

export async function saveData(data) {
  const songs = data.songs.map((song) => ({
    id: song.id,
    title: song.title,
    song_key: song.key || "",
    tempo: song.tempo || "",
    note: song.note || "",
  }));

  const songResources = data.songs.flatMap((song) =>
    (song.resources || []).map((resource) => ({
      id: resource.id,
      song_id: song.id,
      type: resource.type,
      voice_part: resource.voicePart || "全體",
      title: resource.title,
      url: resource.url,
    }))
  );

  const schedules = data.schedules.map((schedule) => ({
    id: schedule.id,
    date: schedule.date,
    title: schedule.title,
    service_type: schedule.serviceType || "主日",
    note: schedule.note || "",
  }));

  const scheduleSongs = data.schedules.flatMap((schedule) =>
    (schedule.songs || []).map((song, index) => ({
      id: `${schedule.id}-${song.id}-${index}`,
      schedule_id: schedule.id,
      song_id: song.id,
      title: song.title,
      usage_type: song.usageType || "獻詩",
      sort_order: index,
    }))
  );

  const archiveVideos = data.archiveVideos.map((video) => ({
    id: video.id,
    title: video.title,
    date: video.date || null,
    event_name: video.eventName || "",
    youtube_url: video.youtubeUrl,
    description: video.description || "",
    tags: video.tags || "",
  }));

  await runQuery(supabase.from("schedule_songs").delete().neq("id", "__never__"));
  await runQuery(supabase.from("song_resources").delete().neq("id", "__never__"));
  await runQuery(supabase.from("archive_videos").delete().neq("id", "__never__"));
  await runQuery(supabase.from("schedules").delete().neq("id", "__never__"));
  await runQuery(supabase.from("songs").delete().neq("id", "__never__"));

  if (songs.length > 0) {
    await runQuery(supabase.from("songs").insert(songs));
  }

  if (schedules.length > 0) {
    await runQuery(supabase.from("schedules").insert(schedules));
  }

  if (songResources.length > 0) {
    await runQuery(supabase.from("song_resources").insert(songResources));
  }

  if (scheduleSongs.length > 0) {
    await runQuery(supabase.from("schedule_songs").insert(scheduleSongs));
  }

  if (archiveVideos.length > 0) {
    await runQuery(supabase.from("archive_videos").insert(archiveVideos));
  }
}

export async function resetData() {
  const data = emptyData;
  await saveData(data);
  return data;
}