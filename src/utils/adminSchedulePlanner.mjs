// Pure functions shared by the phase 2 admin builder and Node regression tests.
export function validateScheduleDraft(form, songDrafts, songs) {
  if (!form.date || !form.title?.trim()) {
    return "請填寫日期與聚會名稱";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    return "日期格式不正確";
  }
  const selected = (songDrafts || []).map((item) => item.songId);
  if (selected.some((id) => !id)) {
    return "請為每筆練習曲目選擇曲名，或移除尚未選擇的欄位";
  }
  if (new Set(selected).size !== selected.length) {
    return "同一場聚會已有重複曲目，請先調整選擇";
  }
  if (selected.some((id) => !songs.some((song) => song.id === id))) {
    return "有曲目已從資料庫移除，請重新選擇";
  }
  return null;
}
export function makeScheduleFromDraft(form, songDrafts, songs, id) {
  const issue = validateScheduleDraft(form, songDrafts, songs);
  if (issue) throw new Error(issue);
  const lookup = new Map(songs.map((song) => [song.id, song]));
  return {
    id,
    date: form.date,
    title: form.title.trim(),
    serviceType: form.serviceType || "主日",
    note: form.note || "",
    songs: (songDrafts || []).map((draft) => ({
      id: draft.songId,
      title: lookup.get(draft.songId).title,
      usageType: draft.usageType || "獻詩",
    })),
  };
}
export function cloneScheduleDraft(schedule) {
  return {
    form: {
      date: "",
      title: schedule.title,
      serviceType: schedule.serviceType || "主日",
      note: schedule.note || "",
    },
    songs: (schedule.songs || []).map((song) => ({
      songId: song.id,
      usageType: song.usageType || "獻詩",
    })),
  };
}
export function insertSchedule(schedules, newSchedule) {
  // Two events with the same calendar date are intentionally different records.
  return [...schedules, newSchedule].sort((a, b) => a.date.localeCompare(b.date));
}
