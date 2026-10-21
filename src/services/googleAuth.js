// Google Identity Services uses a public OAuth web client ID (never a client secret).
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const KEY = "nanxi-google-credential";
const API_URL = import.meta.env.VITE_API_BASE_URL || "https://nanxichurchlinebot.onrender.com";

export function getGoogleCredential() {
  const credential = sessionStorage.getItem(KEY);
  if (!credential) return "";
  try {
    const payload = JSON.parse(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp || payload.exp * 1000 < Date.now() + 30000) {
      sessionStorage.removeItem(KEY);
      return "";
    }
    return credential;
  } catch {
    sessionStorage.removeItem(KEY);
    return "";
  }
}

export function clearGoogleCredential() {
  sessionStorage.removeItem(KEY);
  window.google?.accounts?.id?.disableAutoSelect?.();
}

async function loadGoogleScript() {
  if (window.google?.accounts?.id) return;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-nanxi-google]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.nanxiGoogle = "1";
    script.onload = resolve;
    script.onerror = () => reject(new Error("無法載入 Google 登入服務。"));
    document.head.appendChild(script);
  });
}

export async function renderGoogleSignIn(element, onCredential) {
  if (!CLIENT_ID) throw new Error("尚未設定 VITE_GOOGLE_CLIENT_ID。");
  await loadGoogleScript();
  if (!element) return;
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: ({ credential }) => {
      if (credential) onCredential(credential);
    },
    auto_select: false,
  });
  element.replaceChildren();
  window.google.accounts.id.renderButton(element, {
    theme: "outline", size: "large", text: "signin_with", locale: "zh_TW",
  });
}

export async function authorizeGoogleCredential(credential) {
  const response = await fetch(`${API_URL}/api/admin/me`, {
    headers: { Authorization: `Bearer ${credential}` },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || "管理員驗證失敗。");
  sessionStorage.setItem(KEY, credential);
  return json.email;
}

export async function resumeGoogleAdmin() {
  const credential = getGoogleCredential();
  if (!credential) return false;
  try {
    await authorizeGoogleCredential(credential);
    return true;
  } catch {
    clearGoogleCredential();
    return false;
  }
}
