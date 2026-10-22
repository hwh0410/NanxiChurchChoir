import test from "node:test";
import assert from "node:assert/strict";
import {
  validateScheduleDraft, makeScheduleFromDraft,
  cloneScheduleDraft, insertSchedule
} from "../src/utils/adminSchedulePlanner.mjs";

const songs = [
  { id: "a", title: "主的恩典" },
  { id: "b", title: "同心獻詩" },
  { id: "c", title: "平安之路" },
];
const form = { date: "2026-11-08", title: "  主日禮拜 ", serviceType: "主日", note: "彩排" };

test("saves a new schedule with ordered hymns and usage types", () => {
  const made = makeScheduleFromDraft(form, [
    { songId: "b", usageType: "獻詩" },
    { songId: "a", usageType: "回應詩" },
  ], songs, "schedule-id");
  assert.equal(made.title, "主日禮拜");
  assert.deepEqual(made.songs.map((song) => song.id), ["b", "a"]);
  assert.deepEqual(made.songs.map((song) => song.usageType), ["獻詩", "回應詩"]);
  assert.equal(made.date, "2026-11-08");
  assert.equal(made.note, "彩排");
});

test("allows saving a schedule with no songs", () => {
  assert.deepEqual(makeScheduleFromDraft(form, [], songs, "new").songs, []);
});

test("validates dates, names, missing songs, duplicates and deleted references", () => {
  assert.match(validateScheduleDraft({...form,date:""}, [], songs), /日期/);
  assert.match(validateScheduleDraft({...form,title:"  "}, [], songs), /名稱/);
  assert.match(validateScheduleDraft(form,[{songId:"",usageType:"獻詩"}],songs), /選擇曲名/);
  assert.match(validateScheduleDraft(form,[{songId:"a"},{songId:"a"}],songs), /重複/);
  assert.match(validateScheduleDraft(form,[{songId:"deleted"}],songs), /移除/);
  assert.equal(validateScheduleDraft(form,[{songId:"a"}],songs), null);
});

test("copies a schedule without changing the original and clears date", () => {
  const original = makeScheduleFromDraft(form, [{songId:"a",usageType:"獻詩"}],songs,"old");
  const copy = cloneScheduleDraft(original);
  assert.equal(copy.form.date, "");
  assert.equal(copy.form.title, "主日禮拜");
  copy.songs[0].songId = "b";
  assert.equal(original.songs[0].id, "a");
});

test("same-day services stay separate and monthly ordering is chronological", () => {
  const a = makeScheduleFromDraft(form, [], songs, "a");
  const b = { ...a, id: "b", title: "晚間練習" };
  const earlier = { ...a, id: "c", date: "2026-10-25" };
  const result = insertSchedule([a, earlier], b);
  assert.deepEqual(result.map((event) => event.id), ["c", "a", "b"]);
});
