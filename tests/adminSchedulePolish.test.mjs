import test from "node:test";
import assert from "node:assert/strict";
import { filterAndSortSchedules, dateInTaiwan, nextSundayDate } from "../src/utils/adminSchedulePolish.mjs";

const data = [
  { id: "b", date: "2026-11-08", title: "主日禮拜", serviceType: "主日", note: "", songs: [{ title: "恩典之路" }] },
  { id: "a", date: "2026-11-01", title: "晚間練習", serviceType: "練習", note: "加強和聲", songs: [{ title: "奇異恩典" }] },
  { id: "c", date: "2026-11-08", title: "下午聚會", serviceType: "特別聚會", note: "", songs: [] }
];
test("search matches hymn titles, notes and service names", () => {
  assert.deepEqual(filterAndSortSchedules(data, "恩典之路").map(x => x.id), ["b"]);
  assert.deepEqual(filterAndSortSchedules(data, "和聲").map(x => x.id), ["a"]);
  assert.deepEqual(filterAndSortSchedules(data, "特別聚會").map(x => x.id), ["c"]);
  assert.deepEqual(filterAndSortSchedules(data, "無相符曲目"), []);
});
test("sorts predictably in either date direction without mutating input", () => {
  assert.deepEqual(filterAndSortSchedules(data, "").map(x => x.id), ["a", "b", "c"]);
  assert.deepEqual(filterAndSortSchedules(data, "", "latest").map(x => x.id), ["c", "b", "a"]);
  assert.deepEqual(data.map(x => x.id), ["b", "a", "c"]);
});
test("Taiwan date formatter respects Taipei midnight", () => {
  assert.equal(dateInTaiwan(new Date("2026-10-22T16:30:00Z")), "2026-10-23");
});
test("nearest Sunday can be today and handles year boundary", () => {
  assert.equal(nextSundayDate("2026-11-01"), "2026-11-01");
  assert.equal(nextSundayDate("2026-10-22"), "2026-10-25");
  assert.equal(nextSundayDate("2026-12-31"), "2027-01-03");
});
