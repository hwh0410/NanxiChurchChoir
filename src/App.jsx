import { supabase } from "./services/supabaseClient";
import { getYoutubeEmbedUrl } from "./services/youtube";
import { getGoogleDrivePreviewUrl } from "./services/googleDrive";
import { getYoutubeThumbnail } from "./services/youtube";
import { useEffect, useState } from "react";
import "./styles.css";
import {
  emptyData,
  loadData,
  saveData,
  resetData,
} from "./services/supabaseDb";

const pages = [
  { key: "home", label: "首頁" },
  { key: "calendar", label: "日曆" },
  { key: "songs", label: "曲目" },
  { key: "archive", label: "歷年影片" },
  { key: "admin", label: "管理" },
];

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

function HomePage({ schedules, songs }) {
  const today = new Date().toISOString().slice(0, 10);

  const upcomingSchedules = schedules
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextSchedule =
    upcomingSchedules.length > 0
      ? upcomingSchedules[0]
      : schedules.length > 0
      ? schedules[schedules.length - 1]
      : null;

  return (
    <section className="card">
      <h2>本週曲目</h2>

      {!nextSchedule ? (
        <p>目前尚未建立排程。</p>
      ) : (
        <div>
          <p className="muted">
            {nextSchedule.date}｜{nextSchedule.serviceType}｜{nextSchedule.title}
          </p>

          <h3>{nextSchedule.note || "本週安排"}</h3>

          <div className="practiceList">
            {(nextSchedule.songs || []).map((scheduleSong) => {
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
      )}
    </section>
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

function CalendarPage({ schedules, songs }) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  return (
    <section className="card">
      <h2>日曆排程</h2>
      <p className="muted">點選排程可查看當天教材與練習資源。</p>

      <div className="songListClean">
        {schedules.map((schedule) => (
          <button
            className="songListItem scheduleListItem"
            type="button"
            key={schedule.id}
            onClick={() => setSelectedSchedule(schedule)}
          >
            <div>
              <strong>{schedule.date}｜{schedule.title}</strong>

              <p className="muted">
                {schedule.serviceType}｜{schedule.note || "無備註"}
              </p>

              <div className="scheduleSongPreview">
                {(schedule.songs || []).map((scheduleSong) => {
                  const fullSong = songs.find(
                    (song) => song.id === scheduleSong.id
                  );

                  return (
                    <div
                      className="scheduleSongPreviewItem"
                      key={`${schedule.id}-${scheduleSong.id}`}
                    >
                      <strong>{scheduleSong.title}</strong>
                      <span>{scheduleSong.usageType}</span>
                      <small>
                        調性：{fullSong?.key || "-"}｜速度：{fullSong?.tempo || "-"}
                      </small>
                    </div>
                  );
                })}
              </div>
            </div>

            <span>{(schedule.songs || []).length} 首曲目</span>
          </button>
        ))}
      </div>

      <ScheduleDetailModal
        schedule={selectedSchedule}
        songs={songs}
        onClose={() => setSelectedSchedule(null)}
      />
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

function AdminPage({ data, setData, onReset }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [songForm, setSongForm] = useState({
    title: "",
    key: "",
    tempo: "",
    note: "",
  });

  const [adminTab, setAdminTab] = useState("schedule");

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
    let isMounted = true;

    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!isMounted) return;

      setIsAdminLoggedIn(Boolean(sessionData.session));
      setIsAuthChecking(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAdminLoggedIn(Boolean(session));
        setIsAuthChecking(false);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      alert(`登入失敗：${error.message}`);
      return;
    }

    setIsAdminLoggedIn(true);
    setAdminEmail("");
    setAdminPassword("");
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
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
        <p className="muted">請使用管理員 Email 與密碼登入後台。</p>

        <form className="loginForm" onSubmit={handleAdminLogin}>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="請輸入管理員 Email"
          />

          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="請輸入管理員密碼"
          />

          <button className="primaryButton" type="submit">
            登入
          </button>
        </form>
      </section>
    );
  }

  const updateData = async (newData) => {
    setData(newData);

    try {
      await saveData(newData);
    } catch (error) {
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
        <h2>管理後台</h2>

        <button className="secondaryButton" type="button" onClick={handleAdminLogout}>
          登出
        </button>
      </div>

      <div className="adminTabs">
        <button className={adminTab === "schedule" ? "adminTab active" : "adminTab"} type="button" onClick={() => setAdminTab("schedule")}>排程管理</button>
        <button className={adminTab === "songs" ? "adminTab active" : "adminTab"} type="button" onClick={() => setAdminTab("songs")}>曲目管理</button>
        <button className={adminTab === "resources" ? "adminTab active" : "adminTab"} type="button" onClick={() => setAdminTab("resources")}>練習資源</button>
        <button className={adminTab === "videos" ? "adminTab active" : "adminTab"} type="button" onClick={() => setAdminTab("videos")}>歷年影片</button>
        <button className={adminTab === "settings" ? "adminTab active" : "adminTab"} type="button" onClick={() => setAdminTab("settings")}>資料設定</button>
      </div>

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
          {data.schedules.map((schedule) => {
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
          {data.songs.map((song) => {
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
          {data.songs.map((song) => (
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
          {data.archiveVideos.map((video) => {
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

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [data, setData] = useState(emptyData);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const cloudData = await loadData();
        setData(cloudData);
      } catch (error) {
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
      const newData = await resetData();
      setData(newData);
    } catch (error) {
      alert(`重設資料失敗：${error.message}`);
    }
  };

  const renderPage = () => {
    if (activePage === "home") {
      return <HomePage schedules={data.schedules} songs={data.songs} />;
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

    if (activePage === "admin") {
      return <AdminPage data={data} setData={setData} onReset={handleReset} />;
    }

    return <HomePage schedules={data.schedules} />;
  };

  if (isDataLoading) {
    return (
      <div className="app">
        <main className="main">
          <section className="card">
            <h2>資料載入中...</h2>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="heroOverlay">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="教會Logo" className="heroLogo" />

          <h1>楠西教會聖歌隊時程表&自主練習平台</h1>

          <p className="heroText">
            整合每週曲目、練習資源、樂譜與歷年演唱影片。
          </p>
        </div>
      </header>

      <nav className="navbar">
        {pages.map((page) => (
          <button
            key={page.key}
            className={activePage === page.key ? "navButton active" : "navButton"}
            onClick={() => setActivePage(page.key)}
          >
            {page.label}
          </button>
        ))}
      </nav>

      <main className="main">{renderPage()}</main>
    </div>
  );
}
