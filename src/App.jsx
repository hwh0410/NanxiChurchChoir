import { renderGoogleSignIn, authorizeGoogleCredential, resumeGoogleAdmin, clearGoogleCredential } from "./services/googleAuth";
import { getYoutubeEmbedUrl } from "./services/youtube";
import { getGoogleDrivePreviewUrl } from "./services/googleDrive";
import { getYoutubeThumbnail } from "./services/youtube";
import { useEffect, useState } from "react";
import {
  House, CalendarDays, Music2, Film, Settings2,
  ArrowRight, BookOpen, Play, ChevronLeft, ChevronRight, List, LayoutGrid
} from "lucide-react";
import "./styles.css";
import "./theme-v1.css";
import {
  emptyData,
  loadDataWithStatus,
  saveData,
  resetData,
  getCloudStatus,
} from "./services/cloudDb";

const IS_DESIGN_PREVIEW = import.meta.env.VITE_READ_ONLY_PREVIEW === "true";

const pages = [
  { key: "home", label: "首頁", icon: House },
  { key: "calendar", label: "日曆", icon: CalendarDays },
  { key: "songs", label: "曲目", icon: Music2 },
  { key: "archive", label: "歷年影片", icon: Film },
  { key: "admin", label: "管理", icon: Settings2 },
];

function formatSyncTime(value) {
  if (!value) return "尚無紀錄";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "尚無紀錄";
  }

  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SyncStatusCard({ syncStatus, onRefresh }) {
  const stateLabelMap = {
    loading: "讀取中",
    ready: "已連線",
    saving: "儲存中",
    success: "同步完成",
    error: "同步異常",
    idle: "尚未同步",
  };

  const stateIconMap = {
    loading: "⏳",
    ready: "✅",
    saving: "⏳",
    success: "✅",
    error: "⚠️",
    idle: "ℹ️",
  };

  const state = syncStatus?.state || "idle";
  const cache = syncStatus?.cache || null;

  return (
    <div className={`syncStatusCard ${state}`}>
      <div className="syncStatusMain">
        <div>
          <p className="syncStatusLabel">雲端同步狀態</p>
          <h3>
            <span>{stateIconMap[state] || "ℹ️"}</span>
            {stateLabelMap[state] || "同步狀態"}
          </h3>
          <p className="muted">
            {syncStatus?.message || "正在等待同步狀態。"}
          </p>
        </div>

        {onRefresh && (
          <button
            className="secondaryButton syncRefreshButton"
            type="button"
            onClick={onRefresh}
            disabled={state === "loading" || state === "saving"}
          >
            重新檢查
          </button>
        )}
      </div>

      <div className="syncStatusGrid">
        <div>
          <span>資料來源</span>
          <strong>Google Sheet</strong>
        </div>

        <div>
          <span>LINE Bot 快取</span>
          <strong>{cache?.hasCache ? "已建立" : "尚未確認"}</strong>
        </div>

        <div>
          <span>快取時間</span>
          <strong>{formatSyncTime(cache?.cachedAt)}</strong>
        </div>

        <div>
          <span>上次儲存</span>
          <strong>{formatSyncTime(syncStatus?.lastSavedAt)}</strong>
        </div>
      </div>

      {syncStatus?.error && (
        <p className="syncStatusError">錯誤原因：{syncStatus.error}</p>
      )}
    </div>
  );
}

function ResourceCard({ resource }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumb =
    resource.type === "youtube" ? getYoutubeThumbnail(resource.url) : "";

  const embedUrl =
    resource.type === "youtube"
      ? getYoutubeEmbedUrl(resource.url)
      : "";

  return (
    <div className={`practiceResourceCard ${resource.type}`}>
      {/* YouTube */}
      {resource.type === "youtube" && (
        <div className="videoBox">
          {!isPlaying ? (
            <div
              className="videoThumbWrapper"
              onClick={() => setIsPlaying(true)}
            >
              <img
                className="videoThumb"
                src={thumb}
                alt={`${resource.title}縮圖`}
              />
              <div className="playButton">▶</div>
            </div>
          ) : (
            <iframe
              className="videoIframe"
              src={embedUrl}
              title={resource.title}
              allowFullScreen
            ></iframe>
          )}
        </div>
      )}

      {/* PDF */}
      {resource.type === "score" && (
        <iframe
          className="pdfPreview"
          src={getGoogleDrivePreviewUrl(resource.url)}
          title={resource.title}
        ></iframe>
      )}

      {/* 其他（音檔/連結） */}
      {resource.type !== "youtube" && resource.type !== "score" && (
        <a href={resource.url} target="_blank" rel="noreferrer">
          開啟資源
        </a>
      )}

      {/* 標題 */}
      <div className="resourceMeta">
        <strong>{resource.title}</strong>
        <span>{resource.voicePart || "全體"}</span>
      </div>
    </div>
  );
}

function SongPracticeResources({ song, showHeader = true }) {
  if (!song) {
    return <p className="muted">找不到曲目資料。</p>;
  }

  const resources = song.resources || [];

  const partOrder = [
    "全體",
    "女高音",
    "女低音",
    "男高音",
    "男低音",
    "伴奏",
    "其他",
  ];

  const groupedResources = resources.reduce((groups, resource) => {
    const part = resource.voicePart || "其他";

    if (!groups[part]) {
      groups[part] = [];
    }

    groups[part].push(resource);
    return groups;
  }, {});

  const sortedParts = partOrder.filter((part) => groupedResources[part]);

  return (
    <div className="practiceBox">
      {showHeader && (
        <>
          <h4>{song.title}</h4>

          <p className="muted">
            調性：{song.key || "-"}｜速度：{song.tempo || "-"}
          </p>

          {song.note && <p>{song.note}</p>}
        </>
      )}

      {resources.length === 0 ? (
        <p className="muted">尚未建立練習資源。</p>
      ) : (
        <div className="voicePartGroups">
          {sortedParts.map((part) => (
            <div className="voicePartGroup" key={part}>
              <div className="voicePartTitle">
                <span>{part}</span>
                <small>{groupedResources[part].length} 個資源</small>
              </div>

              <div className="practiceResourceGrid">
                {groupedResources[part].map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HomePage({ schedules, songs, archiveVideos, onNavigate }) {
  // Schedule dates are local calendar dates; use Taiwan's date, not UTC.
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const orderedSchedules = [...schedules].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const nextSchedule = orderedSchedules.find((schedule) => schedule.date >= today);
  const displayedSchedule = nextSchedule || orderedSchedules.at(-1) || null;
  const mainSong = displayedSchedule?.songs?.[0] || null;
  const fullMainSong = songs.find((song) => song.id === mainSong?.id);
  const latestVideo = [...archiveVideos]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0] || null;
  const videoThumb = latestVideo
    ? getYoutubeThumbnail(latestVideo.youtubeUrl)
    : null;

  return (
    <div className="homePage">
      <div className="homeWelcome">
        <div>
          <p className="eyebrow">WORSHIP · LEARN · TOGETHER</p>
          <h2>讓每一次練習，都更靠近彼此。</h2>
          <p>從本週獻詩開始，快速找到行程、樂譜和各聲部的練習資源。</p>
        </div>
        <button className="homeLink" type="button" onClick={() => onNavigate("calendar")}>
          瀏覽行程 <ArrowRight aria-hidden="true" />
        </button>
      </div>

      <div className="homeHighlights">
        <article className="homeHighlight">
          <div className="homeCardTop">
            <span className="homeCardIcon"><CalendarDays aria-hidden="true" /></span>
            近期聚會
          </div>
          <h3 className="homeCardTitle">
            {nextSchedule?.title || (displayedSchedule ? "目前沒有未來行程" : "尚未安排聚會")}
          </h3>
          <p className="homeCardMeta">
            {nextSchedule
              ? [nextSchedule.date, nextSchedule.serviceType].filter(Boolean).join(" · ")
              : displayedSchedule
                ? "可以查看先前的聚會紀錄"
                : "待管理員新增行程"}
          </p>
          <button className="homeCardAction" type="button" onClick={() => onNavigate("calendar")}>
            查看行程 <ArrowRight aria-hidden="true" />
          </button>
        </article>

        <article className="homeHighlight">
          <div className="homeCardTop">
            <span className="homeCardIcon"><Music2 aria-hidden="true" /></span>
            最近安排曲目
          </div>
          <h3 className="homeCardTitle">{mainSong?.title || "等待新曲目"}</h3>
          <p className="homeCardMeta">
            {mainSong
              ? (nextSchedule ? nextSchedule.date + " · " : "先前安排 · ") + (mainSong.usageType || "獻詩")
              : "曲目公布後會顯示在這裡"}
          </p>
          <button className="homeCardAction" type="button" onClick={() => onNavigate("songs")}>
            瀏覽曲目庫 <ArrowRight aria-hidden="true" />
          </button>
        </article>

        <article className="homeHighlight">
          <div className="homeCardTop">
            <span className="homeCardIcon"><BookOpen aria-hidden="true" /></span>
            自主練習
          </div>
          <h3 className="homeCardTitle">
            {fullMainSong?.resources?.length
              ? fullMainSong.resources.length + " 個練習資源"
              : "一起預備練習"}
          </h3>
          <p className="homeCardMeta">
            {fullMainSong?.resources?.length
              ? "樂譜、示範影片及各聲部練習"
              : "從曲目資料庫尋找現有樂譜和音檔"}
          </p>
          <button className="homeCardAction" type="button" onClick={() => onNavigate("songs")}>
            開始練習 <ArrowRight aria-hidden="true" />
          </button>
        </article>

        <article className="homeHighlight homeVideoTile">
          <div className="homeCardTop">
            <span className="homeCardIcon"><Film aria-hidden="true" /></span>
            近期影片
          </div>
          {latestVideo && videoThumb && (
            <button
              type="button"
              className="homeVideoThumbButton"
              onClick={() => onNavigate("archive")}
              aria-label={"前往歷年影片，查看" + latestVideo.title}
            >
              <img src={videoThumb} loading="lazy" alt="" />
              <span className="homeVideoPlay"><Play aria-hidden="true" /></span>
            </button>
          )}
          <h3 className="homeCardTitle">{latestVideo?.title || "珍藏詩班的歌聲"}</h3>
          <p className="homeCardMeta">{latestVideo ? [latestVideo.date, latestVideo.eventName].filter(Boolean).join(" · ") : "演唱紀錄將陸續更新"}</p>
          <button className="homeCardAction" type="button" onClick={() => onNavigate("archive")}>
            歷年演唱影片 <ArrowRight aria-hidden="true" />
          </button>
        </article>
      </div>

      <section
        className="homeScripture"
        style={{ "--landscape-art": `url("${import.meta.env.BASE_URL}media/hills.jpg?v=hd-20261022")` }}
        aria-label="詩班的心聲"
      >
        <div className="homeScriptureInner">
          <p>以詩歌相聚 · 在信仰中同行</p>
          <blockquote>「你們要向耶和華唱新歌！」</blockquote>
          <span>— 詩篇 96:1</span>
        </div>
      </section>

      <section className="card homePractice" aria-labelledby="home-practice-title">
        <div className="homeSectionTitle">
          <div>
            <h2 id="home-practice-title">{nextSchedule ? "近期獻詩與練習" : "詩班曲目與練習"}</h2>
            <p>
              {displayedSchedule
                ? [displayedSchedule.date, displayedSchedule.title].filter(Boolean).join(" · ")
                : "所有曲目都可以在曲目資料庫查詢"}
            </p>
          </div>
          <button className="homeLink" type="button" onClick={() => onNavigate("songs")}>
            所有曲目 <ArrowRight aria-hidden="true" />
          </button>
        </div>
        {displayedSchedule?.songs?.length ? (
          <div className="practiceList">
            {displayedSchedule.songs.map((scheduleSong, index) => {
              const fullSong = songs.find((song) => song.id === scheduleSong.id);
              return (
                <div className="schedulePracticeItem" key={displayedSchedule.id + "-" + scheduleSong.id + "-" + index}>
                  <div className="scheduleSongHeader">
                    <strong>{scheduleSong.title}</strong>
                    <span>{scheduleSong.usageType}</span>
                  </div>
                  <SongPracticeResources song={fullSong} showHeader={false} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="homeEmpty">目前沒有排定練習曲目，可以先到曲目庫查看既有資源。</p>
        )}
      </section>

      <section className="homeArchive" aria-label="歷年演唱影片">
        <div>
          <p className="eyebrow">OUR CHOIR MEMORIES</p>
          <h2>讓歌聲與回憶繼續流傳</h2>
          <p>每一次獻詩，都值得好好珍藏。</p>
        </div>
        {latestVideo ? (
          <button className="homeArchivePreview" type="button" onClick={() => onNavigate("archive")}>
            {videoThumb && <img src={videoThumb} alt="" loading="lazy" />}
            <span>
              <strong>{latestVideo.title}</strong>
              <small>{latestVideo.date || "歷年影片"} · {latestVideo.eventName || "演唱紀錄"}</small>
            </span>
            <Play aria-hidden="true" />
          </button>
        ) : (
          <button className="homeLink" type="button" onClick={() => onNavigate("archive")}>
            查看影片 <ArrowRight aria-hidden="true" />
          </button>
        )}
      </section>
    </div>
  );
}

function ScheduleDetailModal({ schedule, songs, onClose }) {
  if (!schedule) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalPanel" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <h2>{schedule.date}｜{schedule.title}</h2>
            <p className="muted">
              {schedule.serviceType}｜{schedule.note || "無備註"}
            </p>
          </div>

          <button className="secondaryButton" type="button" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="practiceList">
          {(schedule.songs || []).map((scheduleSong) => {
            const fullSong = songs.find((song) => song.id === scheduleSong.id);

            return (
              <div className="schedulePracticeItem" key={scheduleSong.id}>
                <div className="scheduleSongHeader">
                  <strong>{scheduleSong.title}</strong>
                  <span>{scheduleSong.usageType}</span>
                </div>

                <SongPracticeResources song={fullSong} showHeader={false} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Build the calendar with date-only UTC arithmetic so Google Sheets
// YYYY-MM-DD values never shift days when viewed in other time zones.
function taiwanTodayDate() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function monthShift(month, offset) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1))
    .toISOString().slice(0, 7);
}
function firstSelectedDay(month, dates, today) {
  if (today.startsWith(month)) return today;
  const date = dates.find((item) => item.date?.startsWith(month))?.date;
  return date || month + "-01";
}
function CalendarPage({ schedules, songs }) {
  const today = taiwanTodayDate();
  const sortedSchedules = [...schedules]
    .filter((schedule) => /^\d{4}-\d{2}-\d{2}$/.test(schedule.date || ""))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.title || "").localeCompare(b.title || ""));
  const initialMonth = () => {
    const currentMonth = today.slice(0, 7);
    if (sortedSchedules.some((event) => event.date.startsWith(currentMonth))) {
      return currentMonth;
    }
    return sortedSchedules.find((event) => event.date >= today)?.date?.slice(0, 7) ||
      sortedSchedules.at(-1)?.date?.slice(0, 7) || currentMonth;
  };
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(() =>
    firstSelectedDay(initialMonth(), sortedSchedules, today)
  );
  const [viewMode, setViewMode] = useState("month");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [year, monthNumber] = visibleMonth.split("-").map(Number);
  const offset = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const totalCells = Math.max(35, Math.ceil((offset + daysInMonth) / 7) * 7);
  const dates = Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(Date.UTC(year, monthNumber - 1, index + 1 - offset));
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthNumber - 1,
      sunday: date.getUTCDay() === 0,
      saturday: date.getUTCDay() === 6
    };
  });
  const schedulesByDay = new Map();
  sortedSchedules.forEach((schedule) => {
    const list = schedulesByDay.get(schedule.date) || [];
    list.push(schedule);
    schedulesByDay.set(schedule.date, list);
  });
  const monthSchedules = sortedSchedules.filter((event) => event.date.startsWith(visibleMonth));
  const selectedDaySchedules = schedulesByDay.get(selectedDate) || [];
  const nextEvent = sortedSchedules.find((event) => event.date >= today) || null;
  const monthLabel = new Date(Date.UTC(year, monthNumber - 1, 1))
    .toLocaleDateString("zh-TW", { year: "numeric", month: "long", timeZone: "UTC" });

  const jumpMonth = (month) => {
    setVisibleMonth(month);
    setSelectedDate(firstSelectedDay(month, sortedSchedules, today));
    setSelectedSchedule(null);
  };
  const chooseDay = (key) => {
    if (!key.startsWith(visibleMonth)) setVisibleMonth(key.slice(0, 7));
    setSelectedDate(key);
  };
  const viewSchedule = (schedule) => {
    setSelectedDate(schedule.date);
    setSelectedSchedule(schedule);
  };

  return (
    <section className="card choirCalendar" aria-labelledby="calendar-heading">
      <header className="choirCalendarHeader">
        <div>
          <p className="eyebrow">OUR CHOIR CALENDAR</p>
          <h2 id="calendar-heading">詩班行事曆</h2>
          <p className="muted">每場聚會都安排在對應日期上，點選即可查看獻詩曲目與練習資源。</p>
        </div>
        <div className="choirCalendarViewSwitch" role="group" aria-label="日曆顯示方式">
          <button type="button" className={viewMode === "month" ? "active" : ""}
            aria-pressed={viewMode === "month"} onClick={() => setViewMode("month")}>
            <LayoutGrid aria-hidden="true" /> 月曆
          </button>
          <button type="button" className={viewMode === "list" ? "active" : ""}
            aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>
            <List aria-hidden="true" /> 清單
          </button>
        </div>
      </header>

      <div className="choirCalendarToolbar">
        <div className="choirCalendarMonthControls">
          <button type="button" className="choirCalendarArrow"
            onClick={() => jumpMonth(monthShift(visibleMonth, -1))}
            aria-label="上個月"><ChevronLeft aria-hidden="true" /></button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button type="button" className="choirCalendarArrow"
            onClick={() => jumpMonth(monthShift(visibleMonth, 1))}
            aria-label="下個月"><ChevronRight aria-hidden="true" /></button>
        </div>
        <div className="choirCalendarQuickActions">
          <span className="choirCalendarMonthCount">本月 {monthSchedules.length} 場聚會</span>
          <button type="button" className="choirCalendarToday" onClick={() => jumpMonth(today.slice(0, 7))}>
            回到今天
          </button>
        </div>
      </div>

      {viewMode === "month" ? (
        <>
          <div className="choirCalendarWeekdays" aria-hidden="true">
            {["日", "一", "二", "三", "四", "五", "六"].map((weekday, idx) =>
              <span key={weekday} className={idx === 0 ? "sunday" : idx === 6 ? "saturday" : ""}>
                <span className="weekdayFull">星期</span>{weekday}
              </span>
            )}
          </div>
          <div className="choirCalendarGrid">
            {dates.map((day) => {
              const events = schedulesByDay.get(day.key) || [];
              const isToday = day.key === today;
              const isSelected = day.key === selectedDate;
              return (
                <div key={day.key}
                  className={[
                    "choirCalendarDay",
                    !day.inMonth ? "isOutside" : "",
                    day.sunday ? "isSunday" : "",
                    day.saturday ? "isSaturday" : "",
                    isSelected ? "isSelected" : "",
                    isToday ? "isToday" : ""
                  ].filter(Boolean).join(" ")}>
                  <button type="button" className="choirCalendarDate"
                    aria-label={day.key + (events.length ? "，" + events.length + "場聚會" : "") + (isToday ? "，今天" : "")}
                    aria-pressed={isSelected}
                    onClick={() => chooseDay(day.key)}>
                    <span>{day.day}</span>
                    {isToday && <small>今</small>}
                  </button>
                  <div className="choirCalendarEventDots" aria-hidden="true">
                    {events.slice(0, 3).map((event, index) =>
                      <span key={event.id || index} />)}
                  </div>
                  <div className="choirCalendarEvents">
                    {events.slice(0, 2).map((event) => (
                      <button key={event.id} type="button" className="choirCalendarEvent"
                        title={(event.title || "聚會") + "｜" + (event.serviceType || "聚會")}
                        onClick={() => viewSchedule(event)}>
                        <span>{event.title}</span>
                      </button>
                    ))}
                    {events.length > 2 && (
                      <button className="choirCalendarMore" type="button"
                        onClick={() => chooseDay(day.key)}>另有 {events.length - 2} 場</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="choirCalendarLegend">
            <span><i className="legendEvent" />有安排聚會</span>
            <span><i className="legendToday" />今天</span>
          </div>
        </>
      ) : (
        <div className="choirCalendarAgenda">
          {monthSchedules.map((event) => (
            <button key={event.id} type="button" className="choirCalendarAgendaRow"
              onClick={() => viewSchedule(event)}>
              <span className="choirCalendarAgendaDate">
                <strong>{Number(event.date.slice(-2))}</strong>
                <small>{["日", "一", "二", "三", "四", "五", "六"][
                  new Date(event.date + "T00:00:00Z").getUTCDay()]}</small>
              </span>
              <span className="choirCalendarAgendaDescription">
                <strong>{event.title}</strong>
                <small>{event.serviceType || "聚會"} · {(event.songs || []).length} 首曲目</small>
              </span>
              <ChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {monthSchedules.length === 0 && (
        <div className="choirCalendarEmpty">
          <CalendarDays aria-hidden="true" />
          <p>這個月份還沒有排定聚會。</p>
          {nextEvent && (
            <button type="button" className="homeLink"
              onClick={() => jumpMonth(nextEvent.date.slice(0, 7))}>
              查看下一場聚會（{nextEvent.date}） <ArrowRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {viewMode === "month" && (
        <div className="choirCalendarSelectedPanel" aria-live="polite">
          <div className="choirCalendarSelectedHeading">
            <div>
              <p className="eyebrow">SELECTED DAY</p>
              <h3>{selectedDate.replaceAll("-", " / ")}</h3>
            </div>
            <span>{selectedDaySchedules.length} 場聚會</span>
          </div>
          {selectedDaySchedules.length ? (
            <div className="choirCalendarSelectedList">
              {selectedDaySchedules.map((event) => (
                <button key={event.id} type="button" className="choirCalendarSelectedEvent"
                  onClick={() => viewSchedule(event)}>
                  <span><strong>{event.title}</strong>
                    <small>{event.serviceType || "聚會"} · {(event.songs || []).length} 首曲目</small>
                  </span>
                  <span className="choirCalendarSelectedLink">查看內容 <ArrowRight aria-hidden="true" /></span>
                </button>
              ))}
            </div>
          ) : (
            <p className="choirCalendarSelectedNone">這一天沒有安排聚會；點選其他有標記的日期查看。</p>
          )}
        </div>
      )}

      <ScheduleDetailModal schedule={selectedSchedule} songs={songs}
        onClose={() => setSelectedSchedule(null)} />
    </section>
  );
}

function SongDetailModal({ song, onClose }) {
  if (!song) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalPanel" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <h2>{song.title}</h2>
            <p className="muted">
              調性：{song.key || "-"}｜速度：{song.tempo || "-"}
            </p>
          </div>

          <button className="secondaryButton" type="button" onClick={onClose}>
            關閉
          </button>
        </div>

        {song.note && <p>{song.note}</p>}

        <SongPracticeResources song={song} showHeader={false} />
      </div>
    </div>
  );
}

function SongsPage({ songs }) {
  const [selectedSong, setSelectedSong] = useState(null);

  return (
    <section className="card">
      <h2>曲目資料庫</h2>
      <p className="muted">點選曲目可查看樂譜、YouTube練習影片與聲部資源。</p>

      <div className="songListClean">
        {songs.map((song) => (
          <button
            className="songListItem"
            type="button"
            key={song.id}
            onClick={() => setSelectedSong(song)}
          >
            <div>
              <strong>{song.title}</strong>
              <p className="muted">
                調性：{song.key || "-"}｜速度：{song.tempo || "-"}
              </p>
            </div>

            <span>{(song.resources || []).length} 個資源</span>
          </button>
        ))}
      </div>

      <SongDetailModal
        song={selectedSong}
        onClose={() => setSelectedSong(null)}
      />
    </section>
  );
}

function ArchivePage({ archiveVideos }) {
  return (
    <section className="card">
      <h2>歷年演唱影片</h2>

      <div className="videoGrid">
        {archiveVideos.map((video) => (
          <ArchiveVideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}

function ArchiveVideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnail = getYoutubeThumbnail(video.youtubeUrl);
  const embedUrl = getYoutubeEmbedUrl(video.youtubeUrl);

  return (
    <article className="miniCard videoCard">
      {!isPlaying ? (
        <div
          className="videoThumbWrapper"
          onClick={() => setIsPlaying(true)}
        >
          {thumbnail ? (
            <img
              className="videoThumb"
              src={thumbnail}
              alt={`${video.title} YouTube縮圖`}
            />
          ) : (
            <div className="videoPlaceholder">無縮圖</div>
          )}

          <div className="playButton">▶</div>
        </div>
      ) : (
        <iframe
          className="videoIframe"
          src={embedUrl}
          title={video.title}
          allowFullScreen
        ></iframe>
      )}

      <h3>{video.title}</h3>

      <p className="muted">
        {video.date || "未填日期"}｜{video.eventName || "未填場合"}
      </p>

      {video.description && <p>{video.description}</p>}

      {video.tags && <p className="tagText">{video.tags}</p>}
    </article>
  );
}

function AdminPage({ data, setData, onReset, syncStatus, setSyncStatus, onRefreshSyncStatus }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginError, setLoginError] = useState("");

  const [songForm, setSongForm] = useState({
    title: "",
    key: "",
    tempo: "",
    note: "",
  });

  const [adminTab, setAdminTab] = useState("schedule");
  const [adminQuery, setAdminQuery] = useState("");
  const query = adminQuery.trim().toLocaleLowerCase("zh-TW");
  const matchesQuery = (...fields) => !query || fields.some((value) =>
    String(value ?? "").toLocaleLowerCase("zh-TW").includes(query)
  );
  const openAdminTab = (tab) => {
    setAdminTab(tab);
    setAdminQuery("");
  };

  const [resourceForm, setResourceForm] = useState({
    songId: "",
    type: "youtube",
    voicePart: "全體",
    title: "",
    url: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    title: "",
    serviceType: "主日",
    note: "",
    songId: "",
    usageType: "獻詩",
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    date: "",
    eventName: "",
    youtubeUrl: "",
    description: "",
    tags: "",
  });

  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingScheduleSong, setEditingScheduleSong] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);

  useEffect(() => {
    let active = true;
    resumeGoogleAdmin().then((allowed) => {
      if (!active) return;
      setIsAdminLoggedIn(allowed);
      setIsAuthChecking(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isAuthChecking || isAdminLoggedIn) return;
    const target = document.getElementById("nanxi-google-login");
    if (!target) return;
    renderGoogleSignIn(target, async (credential) => {
      try {
        setLoginError("");
        await authorizeGoogleCredential(credential);
        setIsAdminLoggedIn(true);
      } catch (error) {
        clearGoogleCredential();
        setLoginError(error.message);
      }
    }).catch(error => setLoginError(error.message));
  }, [isAuthChecking, isAdminLoggedIn]);

  const handleAdminLogout = () => {
    clearGoogleCredential();
    setIsAdminLoggedIn(false);
  };

  if (isAuthChecking) {
    return (
      <section className="card loginCard">
        <h2>管理員登入</h2>
        <p className="muted">正在確認登入狀態...</p>
      </section>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <section className="card loginCard">
        <h2>管理員登入</h2>
        <p className="muted">請使用已授權的 Google 帳號登入後台。</p>

        <div id="nanxi-google-login" style={{ display: "flex", justifyContent: "center" }} />
        {loginError && <p role="alert" className="muted">{loginError}</p>}
      </section>
    );
  }

  const updateData = async (newData) => {
    setData(newData);

    setSyncStatus({
      state: "saving",
      message: "正在儲存至 Google Sheet，請稍候...",
      cache: syncStatus?.cache || null,
      lastSavedAt: syncStatus?.lastSavedAt || null,
      error: "",
    });

    try {
      const result = await saveData(newData);

      setSyncStatus({
        state: "success",
        message: "已儲存至 Google Sheet，LINE Bot 已同步更新。",
        cache: result.cache || null,
        lastSavedAt: new Date().toISOString(),
        error: "",
      });
    } catch (error) {
      setSyncStatus({
        state: "error",
        message: "儲存失敗，請檢查網路或管理員登入狀態。",
        cache: syncStatus?.cache || null,
        lastSavedAt: syncStatus?.lastSavedAt || null,
        error: error.message,
      });

      alert(`雲端資料儲存失敗：${error.message}`);
    }
  };

  const handleSongChange = (field, value) => {
    setSongForm({
      ...songForm,
      [field]: value,
    });
  };

  const handleAddSong = (event) => {
    event.preventDefault();

    if (!songForm.title) {
      alert("請至少填寫曲名");
      return;
    }

    const newSong = {
      id: `song-${Date.now()}`,
      ...songForm,
      resources: [],
    };

    updateData({
      ...data,
      songs: [newSong, ...data.songs],
    });

    setSongForm({
      title: "",
      key: "",
      tempo: "",
      note: "",
    });
  };

  const handleStartEditSong = (song) => {
    setEditingSong({
      ...song,
      resources: song.resources || [],
    });
  };

  const handleEditingSongChange = (field, value) => {
    setEditingSong({
      ...editingSong,
      [field]: value,
    });
  };

  const handleSaveSongEdit = () => {
    if (!editingSong || !editingSong.title) {
      alert("請至少填寫曲名");
      return;
    }

    const newSongs = data.songs.map((song) => {
      if (song.id !== editingSong.id) return song;
      return editingSong;
    });

    const newSchedules = data.schedules.map((schedule) => ({
      ...schedule,
      songs: (schedule.songs || []).map((song) => {
        if (song.id !== editingSong.id) return song;
        return {
          ...song,
          title: editingSong.title,
        };
      }),
    }));

    updateData({
      ...data,
      songs: newSongs,
      schedules: newSchedules,
    });

    setEditingSong(null);
  };

  const handleDeleteSong = (songId) => {
    const ok = confirm("確定要刪除這首曲目嗎？這也會從排程中移除該曲目。");
    if (!ok) return;

    const newSongs = data.songs.filter((song) => song.id !== songId);

    const newSchedules = data.schedules.map((schedule) => ({
      ...schedule,
      songs: (schedule.songs || []).filter((song) => song.id !== songId),
    }));

    updateData({
      ...data,
      songs: newSongs,
      schedules: newSchedules,
    });
  };

  const handleResourceChange = (field, value) => {
    setResourceForm({
      ...resourceForm,
      [field]: value,
    });
  };

  const handleAddResource = (event) => {
    event.preventDefault();

    if (!resourceForm.songId || !resourceForm.title || !resourceForm.url) {
      alert("請選擇曲目，並填寫資源名稱與連結");
      return;
    }

    const newResource = {
      id: `res-${Date.now()}`,
      ...resourceForm,
    };

    const newSongs = data.songs.map((song) => {
      if (song.id !== resourceForm.songId) return song;

      return {
        ...song,
        resources: [newResource, ...(song.resources || [])],
      };
    });

    updateData({
      ...data,
      songs: newSongs,
    });

    setResourceForm({
      songId: "",
      type: "youtube",
      voicePart: "全體",
      title: "",
      url: "",
    });
  };

  const handleStartEditResource = (songId, resource) => {
    setEditingResource({
      songId,
      ...resource,
    });
  };

  const handleEditingResourceChange = (field, value) => {
    setEditingResource({
      ...editingResource,
      [field]: value,
    });
  };

  const handleSaveResourceEdit = () => {
    if (!editingResource || !editingResource.title || !editingResource.url) {
      alert("請填寫資源名稱與連結");
      return;
    }

    const newSongs = data.songs.map((song) => {
      if (song.id !== editingResource.songId) return song;

      return {
        ...song,
        resources: (song.resources || []).map((resource) => {
          if (resource.id !== editingResource.id) return resource;

          const { songId, ...resourceData } = editingResource;
          return resourceData;
        }),
      };
    });

    updateData({
      ...data,
      songs: newSongs,
    });

    setEditingResource(null);
  };

  const handleDeleteResource = (songId, resourceId) => {
    const ok = confirm("確定要刪除這個練習資源嗎？");
    if (!ok) return;

    const newSongs = data.songs.map((song) => {
      if (song.id !== songId) return song;

      return {
        ...song,
        resources: (song.resources || []).filter(
          (resource) => resource.id !== resourceId
        ),
      };
    });

    updateData({
      ...data,
      songs: newSongs,
    });
  };

  const handleScheduleChange = (field, value) => {
    setScheduleForm({
      ...scheduleForm,
      [field]: value,
    });
  };

  const handleAddSchedule = (event) => {
    event.preventDefault();

    if (!scheduleForm.date || !scheduleForm.title || !scheduleForm.songId) {
      alert("請填寫日期、聚會名稱，並選擇曲目");
      return;
    }

    const selectedSong = data.songs.find((song) => song.id === scheduleForm.songId);

    if (!selectedSong) {
      alert("找不到選擇的曲目");
      return;
    }

    const existingSchedule = data.schedules.find(
      (schedule) => schedule.date === scheduleForm.date
    );

    let newSchedules;

    if (existingSchedule) {
      newSchedules = data.schedules.map((schedule) => {
        if (schedule.id !== existingSchedule.id) return schedule;

        return {
          ...schedule,
          title: scheduleForm.title,
          serviceType: scheduleForm.serviceType,
          note: scheduleForm.note,
          songs: [
            ...(schedule.songs || []),
            {
              id: selectedSong.id,
              title: selectedSong.title,
              usageType: scheduleForm.usageType,
            },
          ],
        };
      });
    } else {
      const newSchedule = {
        id: `sch-${Date.now()}`,
        date: scheduleForm.date,
        title: scheduleForm.title,
        serviceType: scheduleForm.serviceType,
        note: scheduleForm.note,
        songs: [
          {
            id: selectedSong.id,
            title: selectedSong.title,
            usageType: scheduleForm.usageType,
          },
        ],
      };

      newSchedules = [newSchedule, ...data.schedules];
    }

    updateData({
      ...data,
      schedules: newSchedules.sort((a, b) => a.date.localeCompare(b.date)),
    });

    setScheduleForm({
      date: "",
      title: "",
      serviceType: "主日",
      note: "",
      songId: "",
      usageType: "獻詩",
    });
  };

  const handleStartEditSchedule = (schedule) => {
    setEditingSchedule({
      id: schedule.id,
      date: schedule.date,
      title: schedule.title,
      serviceType: schedule.serviceType,
      note: schedule.note || "",
    });
  };

  const handleEditingScheduleChange = (field, value) => {
    setEditingSchedule({
      ...editingSchedule,
      [field]: value,
    });
  };

  const handleSaveScheduleEdit = () => {
    if (!editingSchedule || !editingSchedule.date || !editingSchedule.title) {
      alert("請填寫日期與聚會名稱");
      return;
    }

    const newSchedules = data.schedules
      .map((schedule) => {
        if (schedule.id !== editingSchedule.id) return schedule;

        return {
          ...schedule,
          date: editingSchedule.date,
          title: editingSchedule.title,
          serviceType: editingSchedule.serviceType,
          note: editingSchedule.note,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    updateData({
      ...data,
      schedules: newSchedules,
    });

    setEditingSchedule(null);
  };

  const handleDeleteSchedule = (scheduleId) => {
    const ok = confirm("確定要刪除這筆排程嗎？");
    if (!ok) return;

    updateData({
      ...data,
      schedules: data.schedules.filter((schedule) => schedule.id !== scheduleId),
    });
  };

  const handleStartEditScheduleSong = (scheduleId, songId, usageType) => {
    setEditingScheduleSong({
      scheduleId,
      oldSongId: songId,
      newSongId: songId,
      usageType,
    });
  };

  const handleEditScheduleSongChange = (field, value) => {
    setEditingScheduleSong({
      ...editingScheduleSong,
      [field]: value,
    });
  };

  const handleSaveScheduleSongEdit = () => {
    if (!editingScheduleSong) return;

    const selectedSong = data.songs.find(
      (song) => song.id === editingScheduleSong.newSongId
    );

    if (!selectedSong) {
      alert("找不到選擇的曲目");
      return;
    }

    const newSchedules = data.schedules.map((schedule) => {
      if (schedule.id !== editingScheduleSong.scheduleId) return schedule;

      return {
        ...schedule,
        songs: (schedule.songs || []).map((song) => {
          if (song.id !== editingScheduleSong.oldSongId) return song;

          return {
            id: selectedSong.id,
            title: selectedSong.title,
            usageType: editingScheduleSong.usageType,
          };
        }),
      };
    });

    updateData({
      ...data,
      schedules: newSchedules,
    });

    setEditingScheduleSong(null);
  };

  const handleRemoveScheduleSong = (scheduleId, songId) => {
    const newSchedules = data.schedules.map((schedule) => {
      if (schedule.id !== scheduleId) return schedule;

      return {
        ...schedule,
        songs: (schedule.songs || []).filter((song) => song.id !== songId),
      };
    });

    updateData({
      ...data,
      schedules: newSchedules,
    });
  };

  const handleVideoChange = (field, value) => {
    setVideoForm({
      ...videoForm,
      [field]: value,
    });
  };

  const handleAddVideo = (event) => {
    event.preventDefault();

    if (!videoForm.title || !videoForm.youtubeUrl) {
      alert("請至少填寫曲名/標題與 YouTube 連結");
      return;
    }

    const newVideo = {
      id: `vid-${Date.now()}`,
      ...videoForm,
    };

    updateData({
      ...data,
      archiveVideos: [newVideo, ...data.archiveVideos],
    });

    setVideoForm({
      title: "",
      date: "",
      eventName: "",
      youtubeUrl: "",
      description: "",
      tags: "",
    });
  };

  const handleStartEditVideo = (video) => {
    setEditingVideo({
      ...video,
    });
  };

  const handleEditingVideoChange = (field, value) => {
    setEditingVideo({
      ...editingVideo,
      [field]: value,
    });
  };

  const handleSaveVideoEdit = () => {
    if (!editingVideo || !editingVideo.title || !editingVideo.youtubeUrl) {
      alert("請至少填寫曲名/標題與 YouTube 連結");
      return;
    }

    const newVideos = data.archiveVideos.map((video) => {
      if (video.id !== editingVideo.id) return video;
      return editingVideo;
    });

    updateData({
      ...data,
      archiveVideos: newVideos,
    });

    setEditingVideo(null);
  };

  const handleDeleteVideo = (videoId) => {
    const ok = confirm("確定要刪除這筆歷年影片嗎？");
    if (!ok) return;

    updateData({
      ...data,
      archiveVideos: data.archiveVideos.filter((video) => video.id !== videoId),
    });
  };

  return (
    <section className="card">
      <div className="adminHeader">
        <div>
          <p className="eyebrow">ADMIN WORKSPACE</p>
          <h2>管理後台</h2>
          <p className="muted">集中維護聚會排程、練習曲目與歷年影片。</p>
        </div>
        <button className="secondaryButton" type="button" onClick={handleAdminLogout}>
          登出
        </button>
      </div>
      <div className="adminOverview" aria-label="資料概況">
        <span><strong>{data.schedules.length}</strong> 筆行程</span>
        <span><strong>{data.songs.length}</strong> 首曲目</span>
        <span><strong>{data.archiveVideos.length}</strong> 部影片</span>
      </div>

      <SyncStatusCard
        syncStatus={syncStatus}
        onRefresh={onRefreshSyncStatus}
      />

      <div className="adminTabs">
        <button className={adminTab === "schedule" ? "adminTab active" : "adminTab"} type="button" onClick={() => openAdminTab("schedule")}>排程管理</button>
        <button className={adminTab === "songs" ? "adminTab active" : "adminTab"} type="button" onClick={() => openAdminTab("songs")}>曲目管理</button>
        <button className={adminTab === "resources" ? "adminTab active" : "adminTab"} type="button" onClick={() => openAdminTab("resources")}>練習資源</button>
        <button className={adminTab === "videos" ? "adminTab active" : "adminTab"} type="button" onClick={() => openAdminTab("videos")}>歷年影片</button>
        <button className={adminTab === "settings" ? "adminTab active" : "adminTab"} type="button" onClick={() => openAdminTab("settings")}>資料設定</button>
      </div>
      {adminTab !== "settings" && (
        <div className="adminToolbar">
          <label htmlFor="admin-search">快速搜尋</label>
          <input
            id="admin-search"
            type="search"
            autoComplete="off"
            value={adminQuery}
            onChange={(event) => setAdminQuery(event.target.value)}
            placeholder={
              adminTab === "schedule" ? "搜尋日期、聚會名稱、備註…" :
              adminTab === "songs" ? "搜尋曲名、調性…" :
              adminTab === "resources" ? "搜尋曲目、資源名稱…" :
              "搜尋影片名稱、日期、場合…"
            }
          />
          {query && (
            <button type="button" className="secondaryButton" onClick={() => setAdminQuery("")}>
              清除
            </button>
          )}
        </div>
      )}

            {adminTab === "schedule" && (
        <>
<div className="adminSection">
        <h3>新增/更新每週排程</h3>

        <form className="formGrid" onSubmit={handleAddSchedule}>
          <label>
            日期 *
            <input
              type="date"
              value={scheduleForm.date}
              onChange={(e) => handleScheduleChange("date", e.target.value)}
            />
          </label>

          <label>
            聚會類型
            <select
              value={scheduleForm.serviceType}
              onChange={(e) => handleScheduleChange("serviceType", e.target.value)}
            >
              <option value="主日">主日</option>
              <option value="練習">練習</option>
              <option value="特別聚會">特別聚會</option>
              <option value="其他">其他</option>
            </select>
          </label>

          <label>
            聚會名稱 *
            <input
              value={scheduleForm.title}
              onChange={(e) => handleScheduleChange("title", e.target.value)}
              placeholder="例如：主日禮拜"
            />
          </label>

          <label>
            曲目用途
            <select
              value={scheduleForm.usageType}
              onChange={(e) => handleScheduleChange("usageType", e.target.value)}
            >
              <option value="獻詩">獻詩</option>
              <option value="敬拜詩">敬拜詩</option>
              <option value="回應詩">回應詩</option>
              <option value="練習曲">練習曲</option>
              <option value="其他">其他</option>
            </select>
          </label>

          <label className="fullWidth">
            選擇曲目 *
            <select
              value={scheduleForm.songId}
              onChange={(e) => handleScheduleChange("songId", e.target.value)}
            >
              <option value="">請選擇曲目</option>
              {data.songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
          </label>

          <label className="fullWidth">
            當週備註
            <textarea
              value={scheduleForm.note}
              onChange={(e) => handleScheduleChange("note", e.target.value)}
              placeholder="例如：本週需加強第二段和聲"
            />
          </label>

          <button className="primaryButton" type="submit">
            新增/更新排程
          </button>
        </form>
      </div>

      <div className="adminSection">
        <h3>目前排程</h3>

        <div className="list">
          {data.schedules
            .filter((schedule) => matchesQuery(schedule.date, schedule.title, schedule.serviceType, schedule.note))
            .map((schedule) => {
            const isScheduleEditing =
              editingSchedule && editingSchedule.id === schedule.id;

            return (
              <div className="resourceGroup" key={schedule.id}>
                <div className="listItem">
                  {isScheduleEditing ? (
                    <div className="inlineEditBox">
                      <input
                        type="date"
                        value={editingSchedule.date}
                        onChange={(e) =>
                          handleEditingScheduleChange("date", e.target.value)
                        }
                      />

                      <select
                        value={editingSchedule.serviceType}
                        onChange={(e) =>
                          handleEditingScheduleChange("serviceType", e.target.value)
                        }
                      >
                        <option value="主日">主日</option>
                        <option value="練習">練習</option>
                        <option value="特別聚會">特別聚會</option>
                        <option value="其他">其他</option>
                      </select>

                      <input
                        value={editingSchedule.title}
                        onChange={(e) =>
                          handleEditingScheduleChange("title", e.target.value)
                        }
                        placeholder="聚會名稱"
                      />

                      <textarea
                        value={editingSchedule.note}
                        onChange={(e) =>
                          handleEditingScheduleChange("note", e.target.value)
                        }
                        placeholder="當週備註"
                      />

                      <div className="buttonRow">
                        <button
                          className="primaryButton"
                          type="button"
                          onClick={handleSaveScheduleEdit}
                        >
                          儲存
                        </button>

                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => setEditingSchedule(null)}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <strong>{schedule.date}｜{schedule.title}</strong>
                        <p className="muted">
                          {schedule.serviceType}｜{schedule.note || "無備註"}
                        </p>
                      </div>

                      <div className="buttonRow">
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => handleStartEditSchedule(schedule)}
                        >
                          編輯
                        </button>

                        <button
                          className="smallDangerButton"
                          type="button"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          刪除排程
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {(schedule.songs || []).map((song) => {
                  const isEditing =
                    editingScheduleSong &&
                    editingScheduleSong.scheduleId === schedule.id &&
                    editingScheduleSong.oldSongId === song.id;

                  return (
                    <div className="listItem" key={`${schedule.id}-${song.id}`}>
                      {isEditing ? (
                        <div className="inlineEditBox">
                          <select
                            value={editingScheduleSong.newSongId}
                            onChange={(e) =>
                              handleEditScheduleSongChange(
                                "newSongId",
                                e.target.value
                              )
                            }
                          >
                            {data.songs.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.title}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editingScheduleSong.usageType}
                            onChange={(e) =>
                              handleEditScheduleSongChange(
                                "usageType",
                                e.target.value
                              )
                            }
                          >
                            <option value="獻詩">獻詩</option>
                            <option value="敬拜詩">敬拜詩</option>
                            <option value="回應詩">回應詩</option>
                            <option value="練習曲">練習曲</option>
                            <option value="其他">其他</option>
                          </select>

                          <div className="buttonRow">
                            <button
                              className="primaryButton"
                              type="button"
                              onClick={handleSaveScheduleSongEdit}
                            >
                              儲存
                            </button>

                            <button
                              className="secondaryButton"
                              type="button"
                              onClick={() => setEditingScheduleSong(null)}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <strong>{song.title}</strong>
                            <p className="muted">{song.usageType}</p>
                          </div>

                          <div className="buttonRow">
                            <button
                              className="secondaryButton"
                              type="button"
                              onClick={() =>
                                handleStartEditScheduleSong(
                                  schedule.id,
                                  song.id,
                                  song.usageType
                                )
                              }
                            >
                              編輯
                            </button>

                            <button
                              className="smallDangerButton"
                              type="button"
                              onClick={() =>
                                handleRemoveScheduleSong(schedule.id, song.id)
                              }
                            >
                              移除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

              </>
      )}

      {adminTab === "songs" && (
        <>
<div className="adminSection">
        <h3>新增曲目</h3>

        <form className="formGrid" onSubmit={handleAddSong}>
          <label>
            曲名 *
            <input
              value={songForm.title}
              onChange={(e) => handleSongChange("title", e.target.value)}
              placeholder="例如：奇異恩典"
            />
          </label>

          <label>
            調性
            <input
              value={songForm.key}
              onChange={(e) => handleSongChange("key", e.target.value)}
              placeholder="例如：G"
            />
          </label>

          <label>
            速度
            <input
              value={songForm.tempo}
              onChange={(e) => handleSongChange("tempo", e.target.value)}
              placeholder="例如：72"
            />
          </label>

          <label className="fullWidth">
            備註
            <textarea
              value={songForm.note}
              onChange={(e) => handleSongChange("note", e.target.value)}
              placeholder="例如：第二段注意呼吸"
            />
          </label>

          <button className="primaryButton" type="submit">
            新增曲目
          </button>
        </form>
      </div>

      <div className="adminSection">
        <h3>目前曲目</h3>

        <div className="list">
          {data.songs
            .filter((song) => matchesQuery(song.title, song.key, song.note))
            .map((song) => {
            const isEditing = editingSong && editingSong.id === song.id;

            return (
              <div className="listItem" key={song.id}>
                {isEditing ? (
                  <div className="inlineEditBox">
                    <input
                      value={editingSong.title}
                      onChange={(e) =>
                        handleEditingSongChange("title", e.target.value)
                      }
                      placeholder="曲名"
                    />

                    <input
                      value={editingSong.key}
                      onChange={(e) =>
                        handleEditingSongChange("key", e.target.value)
                      }
                      placeholder="調性"
                    />

                    <input
                      value={editingSong.tempo}
                      onChange={(e) =>
                        handleEditingSongChange("tempo", e.target.value)
                      }
                      placeholder="速度"
                    />

                    <textarea
                      value={editingSong.note}
                      onChange={(e) =>
                        handleEditingSongChange("note", e.target.value)
                      }
                      placeholder="備註"
                    />

                    <div className="buttonRow">
                      <button
                        className="primaryButton"
                        type="button"
                        onClick={handleSaveSongEdit}
                      >
                        儲存
                      </button>

                      <button
                        className="secondaryButton"
                        type="button"
                        onClick={() => setEditingSong(null)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{song.title}</strong>
                      <p className="muted">
                        調性：{song.key || "-"}｜速度：{song.tempo || "-"}
                      </p>
                    </div>

                    <div className="buttonRow">
                      <button
                        className="secondaryButton"
                        type="button"
                        onClick={() => handleStartEditSong(song)}
                      >
                        編輯
                      </button>

                      <button
                        className="smallDangerButton"
                        type="button"
                        onClick={() => handleDeleteSong(song.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

              </>
      )}

      {adminTab === "resources" && (
        <>
<div className="adminSection">
        <h3>新增曲目練習資源</h3>

        <form className="formGrid" onSubmit={handleAddResource}>
          <label>
            選擇曲目 *
            <select
              value={resourceForm.songId}
              onChange={(e) => handleResourceChange("songId", e.target.value)}
            >
              <option value="">請選擇曲目</option>
              {data.songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            資源類型
            <select
              value={resourceForm.type}
              onChange={(e) => handleResourceChange("type", e.target.value)}
            >
              <option value="youtube">YouTube影片</option>
              <option value="score">樂譜連結</option>
              <option value="audio">音檔連結</option>
              <option value="link">其他連結</option>
            </select>
          </label>

          <label>
            聲部
            <select
              value={resourceForm.voicePart}
              onChange={(e) => handleResourceChange("voicePart", e.target.value)}
            >
              <option value="全體">全體</option>
              <option value="女高音">女高音</option>
              <option value="女低音">女低音</option>
              <option value="男高音">男高音</option>
              <option value="男低音">男低音</option>
              <option value="伴奏">伴奏</option>
            </select>
          </label>

          <label>
            資源名稱 *
            <input
              value={resourceForm.title}
              onChange={(e) => handleResourceChange("title", e.target.value)}
              placeholder="例如：女高音練習影片"
            />
          </label>

          <label className="fullWidth">
            資源連結 *
            <input
              value={resourceForm.url}
              onChange={(e) => handleResourceChange("url", e.target.value)}
              placeholder="YouTube連結、PDF連結或雲端檔案連結"
            />
          </label>

          <button className="primaryButton" type="submit">
            新增練習資源
          </button>
        </form>
      </div>

      <div className="adminSection">
        <h3>目前練習資源</h3>

        <div className="list">
          {data.songs
            .filter((song) => matchesQuery(song.title, ...(song.resources || []).map((resource) => resource.title)))
            .map((song) => (
            <div className="resourceGroup" key={song.id}>
              <strong>{song.title}</strong>

              {(song.resources || []).length === 0 ? (
                <p className="muted">尚無資源</p>
              ) : (
                (song.resources || []).map((resource) => {
                  const isEditing =
                    editingResource && editingResource.id === resource.id;

                  return (
                    <div className="listItem" key={resource.id}>
                      {isEditing ? (
                        <div className="inlineEditBox">
                          <select
                            value={editingResource.type}
                            onChange={(e) =>
                              handleEditingResourceChange("type", e.target.value)
                            }
                          >
                            <option value="youtube">YouTube影片</option>
                            <option value="score">樂譜連結</option>
                            <option value="audio">音檔連結</option>
                            <option value="link">其他連結</option>
                          </select>

                          <select
                            value={editingResource.voicePart}
                            onChange={(e) =>
                              handleEditingResourceChange(
                                "voicePart",
                                e.target.value
                              )
                            }
                          >
                            <option value="全體">全體</option>
                            <option value="女高音">女高音</option>
                            <option value="女低音">女低音</option>
                            <option value="男高音">男高音</option>
                            <option value="男低音">男低音</option>
                            <option value="伴奏">伴奏</option>
                          </select>

                          <input
                            value={editingResource.title}
                            onChange={(e) =>
                              handleEditingResourceChange("title", e.target.value)
                            }
                            placeholder="資源名稱"
                          />

                          <input
                            value={editingResource.url}
                            onChange={(e) =>
                              handleEditingResourceChange("url", e.target.value)
                            }
                            placeholder="資源連結"
                          />

                          <div className="buttonRow">
                            <button
                              className="primaryButton"
                              type="button"
                              onClick={handleSaveResourceEdit}
                            >
                              儲存
                            </button>

                            <button
                              className="secondaryButton"
                              type="button"
                              onClick={() => setEditingResource(null)}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <strong>{resource.title}</strong>
                            <p className="muted">
                              {resource.voicePart}｜{resource.type}
                            </p>
                          </div>

                          <div className="buttonRow">
                            <button
                              className="secondaryButton"
                              type="button"
                              onClick={() =>
                                handleStartEditResource(song.id, resource)
                              }
                            >
                              編輯
                            </button>

                            <button
                              className="smallDangerButton"
                              type="button"
                              onClick={() =>
                                handleDeleteResource(song.id, resource.id)
                              }
                            >
                              刪除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

              </>
      )}

      {adminTab === "videos" && (
        <>
<div className="adminSection">
        <h3>新增歷年演唱影片</h3>

        <form className="formGrid" onSubmit={handleAddVideo}>
          <label>
            曲名/標題 *
            <input
              value={videoForm.title}
              onChange={(e) => handleVideoChange("title", e.target.value)}
              placeholder="例如：奇異恩典"
            />
          </label>

          <label>
            演唱日期
            <input
              type="date"
              value={videoForm.date}
              onChange={(e) => handleVideoChange("date", e.target.value)}
            />
          </label>

          <label>
            場合
            <input
              value={videoForm.eventName}
              onChange={(e) => handleVideoChange("eventName", e.target.value)}
              placeholder="例如：聖誕主日"
            />
          </label>

          <label>
            YouTube 連結 *
            <input
              value={videoForm.youtubeUrl}
              onChange={(e) => handleVideoChange("youtubeUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="fullWidth">
            備註
            <textarea
              value={videoForm.description}
              onChange={(e) => handleVideoChange("description", e.target.value)}
              placeholder="例如：聖誕節獻詩紀錄"
            />
          </label>

          <label className="fullWidth">
            標籤
            <input
              value={videoForm.tags}
              onChange={(e) => handleVideoChange("tags", e.target.value)}
              placeholder="例如：聖誕,獻詩"
            />
          </label>

          <button className="primaryButton" type="submit">
            新增影片
          </button>
        </form>
      </div>

      <div className="adminSection">
        <h3>目前歷年影片</h3>

        <div className="list">
          {data.archiveVideos
            .filter((video) => matchesQuery(video.title, video.date, video.eventName, video.description))
            .map((video) => {
            const isEditing = editingVideo && editingVideo.id === video.id;

            return (
              <div className="listItem" key={video.id}>
                {isEditing ? (
                  <div className="inlineEditBox">
                    <input
                      value={editingVideo.title}
                      onChange={(e) =>
                        handleEditingVideoChange("title", e.target.value)
                      }
                      placeholder="曲名/標題"
                    />

                    <input
                      type="date"
                      value={editingVideo.date}
                      onChange={(e) =>
                        handleEditingVideoChange("date", e.target.value)
                      }
                    />

                    <input
                      value={editingVideo.eventName}
                      onChange={(e) =>
                        handleEditingVideoChange("eventName", e.target.value)
                      }
                      placeholder="場合"
                    />

                    <input
                      value={editingVideo.youtubeUrl}
                      onChange={(e) =>
                        handleEditingVideoChange("youtubeUrl", e.target.value)
                      }
                      placeholder="YouTube連結"
                    />

                    <textarea
                      value={editingVideo.description}
                      onChange={(e) =>
                        handleEditingVideoChange("description", e.target.value)
                      }
                      placeholder="備註"
                    />

                    <input
                      value={editingVideo.tags}
                      onChange={(e) =>
                        handleEditingVideoChange("tags", e.target.value)
                      }
                      placeholder="標籤"
                    />

                    <div className="buttonRow">
                      <button
                        className="primaryButton"
                        type="button"
                        onClick={handleSaveVideoEdit}
                      >
                        儲存
                      </button>

                      <button
                        className="secondaryButton"
                        type="button"
                        onClick={() => setEditingVideo(null)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{video.title}</strong>
                      <p className="muted">
                        {video.date || "未填日期"}｜{video.eventName || "未填場合"}
                      </p>
                    </div>

                    <div className="buttonRow">
                      <button
                        className="secondaryButton"
                        type="button"
                        onClick={() => handleStartEditVideo(video)}
                      >
                        編輯
                      </button>

                      <button
                        className="smallDangerButton"
                        type="button"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

              </>
      )}

      {adminTab === "settings" && (
        <div className="adminSection">
          <h3>資料設定</h3>
          <p className="muted">可將資料重設為範例資料。</p>

          <button className="dangerButton" type="button" onClick={onReset}>
        重設為範例資料
      </button>
        </div>
      )}
    </section>
  );
}

function AdminReadOnlyPreview({ data }) {
  const [tab, setTab] = useState("schedules");
  const [keyword, setKeyword] = useState("");
  const categories = [
    { key: "schedules", label: "行程管理", count: data.schedules.length },
    { key: "songs", label: "曲目管理", count: data.songs.length },
    { key: "resources", label: "練習資源", count: data.songs.reduce((sum, song) => sum + (song.resources || []).length, 0) },
    { key: "videos", label: "歷年影片", count: data.archiveVideos.length },
  ];
  const rows = {
    schedules: data.schedules.map(item => ({
      key: item.id, title: item.title, meta: [item.date, item.serviceType].filter(Boolean).join(" · "),
    })),
    songs: data.songs.map(item => ({
      key: item.id, title: item.title, meta: [item.key || "未設定調性", (item.resources || []).length + " 個資源"].join(" · "),
    })),
    resources: data.songs.flatMap(song => (song.resources || []).map(res => ({
      key: res.id, title: res.title || "練習資源", meta: [song.title, res.voicePart || "全體"].join(" · "),
    }))),
    videos: data.archiveVideos.map(item => ({
      key: item.id, title: item.title, meta: [item.date, item.eventName].filter(Boolean).join(" · "),
    })),
  };
  const query = keyword.trim().toLocaleLowerCase("zh-TW");
  const visible = (rows[tab] || []).filter(item =>
    !query || (item.title + " " + item.meta).toLocaleLowerCase("zh-TW").includes(query)
  );
  return (
    <section className="card adminDesignPreview">
      <div className="adminHeader">
        <div>
          <p className="eyebrow">ADMIN WORKSPACE · DESIGN PREVIEW</p>
          <h2>管理後台</h2>
          <p className="muted">工作台視覺示意，使用真實的公開資料；此預覽禁止任何寫入操作。</p>
        </div>
        <span className="adminReadOnlyTag">唯讀預覽</span>
      </div>
      <div className="adminOverview">
        <span><strong>{data.schedules.length}</strong> 筆行程</span>
        <span><strong>{data.songs.length}</strong> 首曲目</span>
        <span><strong>{data.archiveVideos.length}</strong> 部影片</span>
      </div>
      <div className="adminTabs">
        {categories.map(cat => (
          <button
            type="button"
            key={cat.key}
            className={tab === cat.key ? "adminTab active" : "adminTab"}
            onClick={() => { setTab(cat.key); setKeyword(""); }}
          >{cat.label} <small>({cat.count})</small></button>
        ))}
      </div>
      <div className="adminToolbar">
        <label htmlFor="design-search">快速搜尋</label>
        <input
          id="design-search"
          type="search"
          autoComplete="off"
          placeholder="輸入關鍵字搜尋資料…"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
        />
      </div>
      <div className="adminDesignList" aria-live="polite">
        <div className="adminDesignListHeading">
          <h3>{categories.find(item => item.key === tab)?.label}</h3>
          <span>共 {visible.length} 筆</span>
        </div>
        {visible.slice(0, 14).map(item => (
          <div key={item.key} className="adminDesignListItem">
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.meta || "尚無補充資料"}</p>
            </div>
            <span className="adminDesignEdit">查看資料</span>
          </div>
        ))}
        {visible.length === 0 && <p className="homeEmpty">沒有符合條件的資料。</p>}
        {visible.length > 14 && <p className="muted">預覽僅顯示前 14 筆，正式管理版會保留完整清單。</p>}
      </div>
      <p className="adminDesignDisclaimer">
        <BookOpen aria-hidden="true" />
        這是外觀與資訊排列預覽。新增、編輯及刪除按鈕均未啟用；正式後台仍在原網站正常運作。
      </p>
    </section>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [data, setData] = useState(emptyData);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    state: "loading",
    message: "正在讀取 Google Sheet 資料...",
    cache: null,
    lastSavedAt: null,
    error: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await loadDataWithStatus();

        setData(result.data);
        setSyncStatus({
          state: "ready",
          message: "已連線 Google Sheet，資料讀取成功。",
          cache: result.cache || null,
          lastSavedAt: null,
          error: "",
        });
      } catch (error) {
        setSyncStatus({
          state: "error",
          message: "讀取雲端資料失敗。",
          cache: null,
          lastSavedAt: null,
          error: error.message,
        });

        alert(`讀取雲端資料失敗：${error.message}`);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleReset = async () => {
    const ok = confirm("確定要清空雲端資料嗎？");
    if (!ok) return;

    try {
      setSyncStatus({
        state: "saving",
        message: "正在清空並同步 Google Sheet...",
        cache: syncStatus?.cache || null,
        lastSavedAt: syncStatus?.lastSavedAt || null,
        error: "",
      });

      const result = await resetData();

      setData(result.data);
      setSyncStatus({
        state: "success",
        message: "資料已清空並同步至 Google Sheet。",
        cache: result.cache || null,
        lastSavedAt: new Date().toISOString(),
        error: "",
      });
    } catch (error) {
      setSyncStatus({
        state: "error",
        message: "重設資料失敗。",
        cache: syncStatus?.cache || null,
        lastSavedAt: syncStatus?.lastSavedAt || null,
        error: error.message,
      });

      alert(`重設資料失敗：${error.message}`);
    }
  };

  const handleRefreshSyncStatus = async () => {
    setSyncStatus((current) => ({
      ...current,
      state: "loading",
      message: "正在重新檢查 LINE Bot 快取狀態...",
      error: "",
    }));

    try {
      const result = await getCloudStatus();

      setSyncStatus((current) => ({
        ...current,
        state: "ready",
        message: "已連線 Google Sheet，LINE Bot 快取狀態正常。",
        cache: result.cache || null,
        error: "",
      }));
    } catch (error) {
      setSyncStatus((current) => ({
        ...current,
        state: "error",
        message: "無法取得 LINE Bot 快取狀態。",
        error: error.message,
      }));
    }
  };

  const renderPage = () => {
    if (activePage === "home") {
      return <HomePage schedules={data.schedules} songs={data.songs} archiveVideos={data.archiveVideos} onNavigate={setActivePage} />;
    }

    if (activePage === "calendar") {
      return <CalendarPage schedules={data.schedules} songs={data.songs} />;
    }

    if (activePage === "songs") {
      return <SongsPage songs={data.songs} />;
    }

    if (activePage === "archive") {
      return <ArchivePage archiveVideos={data.archiveVideos} />;
    }

    if (activePage === "admin" && IS_DESIGN_PREVIEW) {
      return <AdminReadOnlyPreview data={data} />;
    }

    if (activePage === "admin") {
      return (
        <AdminPage
          data={data}
          setData={setData}
          onReset={handleReset}
          syncStatus={syncStatus}
          setSyncStatus={setSyncStatus}
          onRefreshSyncStatus={handleRefreshSyncStatus}
        />
      );
    }

    return <HomePage schedules={data.schedules} songs={data.songs} archiveVideos={data.archiveVideos} onNavigate={setActivePage} />;
  };

  if (isDataLoading) {
    return (
      <div className="app loadingApp">
        <div className="loadingScreen">
          <div className="loadingSpinner" />
          <p className="loadingText">正在連接雲端資料...</p>
          <p className="muted">楠西教會聖歌隊</p>
        </div>
      </div>
    );
  }

  return (
    <div className={activePage === "home" ? "app homeApp" : "app"}>
      {IS_DESIGN_PREVIEW && (
        <div className="designPreviewNotice" role="status">
          <span>設計預覽 · 唯讀展示，不會修改正式資料</span>
          <a href="https://hwh0410.github.io/NanxiChurchChoir/">返回正式網站</a>
        </div>
      )}
      <header
        className={activePage === "home" ? "hero heroPhotographic" : "hero heroCompact"}
        style={activePage === "home" ? { "--hero-art": `url("${import.meta.env.BASE_URL}media/church-hero.jpg?v=hd-20261022")` } : undefined}
      >
        {activePage === "home" && <img className="heroFlowers" src={`${import.meta.env.BASE_URL}media/flowers-right.png?v=hd-20261022`} alt="" aria-hidden="true" />}
        <div className="heroOverlay">
          <div className="heroBrand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="楠西教會標誌" className="heroLogo" />
            <span className="heroBrandName">
              <strong>楠西教會聖歌隊</strong>
              <small>NANXI CHURCH CHOIR</small>
            </span>
          </div>
          <p className="heroEyebrow">SING HIS LOVE · SHARE HIS GRACE</p>
          <h1>楠西教會聖歌隊<br />時程表與自主練習平台</h1>
          <p className="heroText">
            每週獻詩曲目、各聲部練習資源、樂譜與歷年演唱紀錄。
            讓我們在詩歌中相聚，也在練習中成長。
          </p>
          <div className="heroAccent" aria-hidden="true" />
        </div>
      </header>

      <nav className="navbar">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <button
              key={page.key}
              type="button"
              className={activePage === page.key ? "navButton active" : "navButton"}
              aria-current={activePage === page.key ? "page" : undefined}
              onClick={() => setActivePage(page.key)}
            >
              <Icon aria-hidden="true" />
              {page.label}
            </button>
          );
        })}
      </nav>

      <main className="main">
        {activePage === "home" && <img className="pageFlowersLeft" src={`${import.meta.env.BASE_URL}media/flowers-left.png?v=hd-20261022`} alt="" aria-hidden="true" />}
        {renderPage()}
      </main>
    </div>
  );
}
