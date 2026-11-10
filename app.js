const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const $ = (id) => document.getElementById(id);
const initData = tg?.initData || "";
const headers = () => ({ "content-type": "application/json", "x-telegram-init-data": initData });

function message(text, bad = false) {
  $("notice").textContent = text;
  $("notice").style.color = bad ? "#ff9b9b" : "#c8d7e1";
}
function renderBay(id, busy) {
  const el = $(id);
  el.classList.toggle("busy", busy);
  el.classList.toggle("free", !busy);
  el.querySelector(".state").textContent = busy ? "BAND" : "BO‘SH";
  el.querySelector(".hint").textContent = busy ? "Mashina yuvilmoqda" : "Hozir bo‘sh";
}
function render(data) {
  renderBay("bay1", data.box1_busy);
  renderBay("bay2", data.box2_busy);
  $("queueState").textContent = data.queue_enabled ? "Navbat bor" : "Navbat yo‘q";
  $("queueCount").textContent = data.queue_enabled ? data.queue_count : 0;
  $("publicNote").textContent = data.note || "Hozircha izoh yo‘q.";
  $("updatedAt").textContent = data.updated_at
    ? "Yangilandi: " + new Date(data.updated_at).toLocaleString("uz-UZ")
    : "";
  $("box1").checked = data.box1_busy;
  $("box2").checked = data.box2_busy;
  $("queue").checked = data.queue_enabled;
  $("countInput").value = data.queue_count;
  $("noteInput").value = data.note || "";
}
async function loadStatus() {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server xatosi");
    render(data);
    message("Holat yangilandi");
  } catch (e) { message(e.message, true); }
}
async function identifyUser() {
  if (!initData) {
    message("Mini App'ni @SaboMoykaBot ichidagi tugma orqali oching.", true);
    return;
  }
  try {
    const res = await fetch("/api/me", { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.isAdmin) $("admin").classList.remove("hidden");
  } catch (e) { message(e.message, true); }
}
$("saveBtn").addEventListener("click", async () => {
  const payload = {
    box1_busy: $("box1").checked,
    box2_busy: $("box2").checked,
    queue_enabled: $("queue").checked,
    queue_count: Number($("countInput").value),
    note: $("noteInput").value
  };
  $("saveBtn").disabled = true;
  try {
    const res = await fetch("/api/status", { method: "PUT", headers: headers(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Saqlashda xato");
    render(data); message("Saqlandi. Mijozlar holatni yangilangan holda ko‘radi.");
    tg?.HapticFeedback?.notificationOccurred("success");
  } catch (e) { message(e.message, true); }
  finally { $("saveBtn").disabled = false; }
});
$("sendBtn").addEventListener("click", async () => {
  const text = $("announcement").value.trim();
  if (!text) return message("Avval e’lon matnini yozing.", true);
  $("sendBtn").disabled = true;
  try {
    const res = await fetch("/api/announcement", { method: "POST", headers: headers(), body: JSON.stringify({ text }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Yuborilmadi");
    $("announcement").value = "";
    message("E’lon @sabomoyka kanaliga yuborildi.");
    tg?.HapticFeedback?.notificationOccurred("success");
  } catch (e) { message(e.message, true); }
  finally { $("sendBtn").disabled = false; }
});
identifyUser();
loadStatus();
setInterval(loadStatus, 10000);
