(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("f");
  if (!form) return;

  const username = $("em");
  const password = $("pw");
  const eyeButton = $("eye");
  const remember = $("remember");
  const errorBox = $("e");
  const submitButton = $("submitBtn");
  const submitLabel = $("submitLabel");
  const capsHint = $("capsHint");
  const contactPanel = $("contactPanel");
  const supportForm = $("supportForm");
  const faceModal = $("faceModal");
  const scan = $("scan");
  const faceTitle = $("faceTitle");
  const faceHint = $("faceHint");
  const faceAction = $("faceAction");
  const facePassword = $("facePassword");
  const faceNote = $("faceNote");
  const resetModal = $("resetModal");
  const resetForm = $("resetForm");
  const resetLogin = $("resetLogin");
  const resetContact = $("resetContact");
  const resetStatus = $("resetStatus");
  const resetSubmit = $("resetSubmit");
  const toastBox = $("toast");

  const savedLogin = localStorage.getItem("progress-last-login");

  /* ---------- тексты ---------- */
  const RU = {
    show: "Показать пароль",
    hide: "Скрыть пароль",
    submit: "Войти в личный кабинет",
    loading: "Входим…",
    empty: "Введите логин и пароль",
    short: "Пароль должен содержать не меньше 8 символов",
    bad: "Неверный логин или пароль",
    serverDown: "Сервер недоступен. Запустите его командой: node server.js",
    network: "Нет связи с сервером. Проверьте подключение и попробуйте ещё раз.",
    caps: "Включена клавиша Caps Lock",
    statusChecking: "Проверяем сервер…",
    statusOnline: "Сервер на связи",
    statusOffline: "Сервер недоступен",
    faceId: "Войти с Face ID",
    faceTitle: "Вход с Face ID",
    faceHint: "Войдите по лицу, отпечатку или PIN на этом устройстве.",
    faceNote: "Биометрические данные остаются на устройстве, сервер получает только подтверждение входа.",
    faceAction: "Отсканировать лицо",
    faceRetry: "Попробовать снова",
    faceContinue: "Продолжить",
    facePassword: "Войти по паролю",
    faceScanTitle: "Смотрим на вас…",
    faceScanHint: "Подтвердите вход в системном окне Face ID, Touch ID или Windows Hello.",
    faceDoneTitle: "Готово!",
    faceDoneHint: "Личность подтверждена. Открываем журнал…",
    faceCancel: "Сканирование отменено",
    faceCancelHint: "Можно попробовать ещё раз или войти по паролю.",
    faceErrorTitle: "Не удалось войти",
    faceErrorHint: "Face ID не сработал. Попробуйте снова или войдите по паролю.",
    faceNoSetupTitle: "Face ID ещё не настроен",
    faceNoSetupHint: "Войдите с паролем: после входа мы предложим включить Face ID на этом устройстве.",
    faceNoSupportTitle: "Face ID недоступен",
    faceNoSupportHint: "Этот браузер или устройство не поддерживает вход по лицу. Используйте пароль или Google.",
    faceNoSupportNote: "Face ID работает в Safari на iPhone и Mac, в Chrome на Android и в Windows Hello.",
    enableTitle: "Включить Face ID?",
    enableHint: "В следующий раз входите в журнал одним взглядом — без пароля.",
    enableNote: "Face ID можно включить на нескольких устройствах и отключить в профиле.",
    enableAction: "Включить Face ID",
    enableSkip: "Не сейчас",
    enableWorkTitle: "Настраиваем Face ID…",
    enableWorkHint: "Подтвердите личность в системном окне, чтобы сохранить ключ на устройстве.",
    enabledTitle: "Face ID подключён",
    enabledHint: "Теперь вход одним взглядом доступен на этом устройстве.",
    resetSending: "Отправляем запрос…",
    resetSent: "Запрос отправлен. Администратор свяжется с вами.",
    resetSubmit: "Отправить запрос",
    resetError: "Не удалось отправить запрос. Попробуйте позже.",
    resetNoLogin: "Укажите логин",
    supportSending: "Отправляем обращение…",
    supportSent: "Обращение №{id} передано администратору",
    supportError: "Не удалось отправить обращение",
    supportNetwork: "Сервер недоступен. Попробуйте позже.",
    toastEnabled: "Face ID включён на этом устройстве",
    toastSuccess: "Вход по Face ID выполнен",
    google: {
      "google-unconfigured": "Вход через Google пока не настроен. Обратитесь к администратору.",
      "google-cancelled": "Вход через Google отменён.",
      "google-unlinked": "Этот Google email не привязан к аккаунту. Обратитесь к администратору.",
      "google-disabled": "Аккаунт отключён. Обратитесь к администратору.",
      "google-error": "Не удалось войти через Google. Попробуйте ещё раз."
    }
  };

  const KK = {
    show: "Құпиясөзді көрсету",
    hide: "Құпиясөзді жасыру",
    submit: "Жеке кабинетке кіру",
    loading: "Кіру…",
    empty: "Логин мен құпиясөзді енгізіңіз",
    short: "Құпиясөз кемінде 8 таңбадан тұруы керек",
    bad: "Логин немесе құпиясөз қате",
    serverDown: "Сервер қолжетімсіз. Команданы іске қосыңыз: node server.js",
    network: "Сервермен байланыс жоқ. Қосылымды тексеріп, қайталап көріңіз.",
    caps: "Caps Lock пернесі қосулы",
    statusChecking: "Сервер тексерілуде…",
    statusOnline: "Сервер қосылған",
    statusOffline: "Сервер қолжетімсіз",
    faceId: "Face ID арқылы кіру",
    faceTitle: "Face ID арқылы кіру",
    faceHint: "Осы құрылғыда бет, саусақ ізі немесе PIN арқылы кіріңіз.",
    faceNote: "Биометриялық деректер құрылғыда қалады, сервер тек кіруді растауды алады.",
    faceAction: "Бетті сканерлеу",
    faceRetry: "Қайталап көру",
    faceContinue: "Жалғастыру",
    facePassword: "Құпиясөзбен кіру",
    faceScanTitle: "Сізге қарап тұрмыз…",
    faceScanHint: "Face ID, Touch ID немесе Windows Hello жүйелік терезесінде кіруді растаңыз.",
    faceDoneTitle: "Дайын!",
    faceDoneHint: "Жеке басыңыз расталды. Журнал ашылуда…",
    faceCancel: "Сканерлеу тоқтатылды",
    faceCancelHint: "Қайта көріңіз немесе құпиясөзбен кіріңіз.",
    faceErrorTitle: "Кіру мүмкін болмады",
    faceErrorHint: "Face ID іске аспады. Қайталап көріңіз немесе құпиясөзбен кіріңіз.",
    faceNoSetupTitle: "Face ID әлі бапталмаған",
    faceNoSetupHint: "Құпиясөзбен кіріңіз: кіргеннен кейін осы құрылғыда Face ID қосуды ұсынамыз.",
    faceNoSupportTitle: "Face ID қолжетімсіз",
    faceNoSupportHint: "Бұл браузер немесе құрылғы бет арқылы кіруді қолдамайды. Құпиясөзді немесе Google-ды қолданыңыз.",
    faceNoSupportNote: "Face ID iPhone мен Mac-тегі Safari-де, Android-тағы Chrome-да және Windows Hello-да жұмыс істейді.",
    enableTitle: "Face ID қосу керек пе?",
    enableHint: "Келесі жолы журналға бір қараумен кіріңіз — құпиясөзсіз.",
    enableNote: "Face ID-ді бірнеше құрылғыда қосуға және профильде өшіруге болады.",
    enableAction: "Face ID қосу",
    enableSkip: "Қазір емес",
    enableWorkTitle: "Face ID бапталуда…",
    enableWorkHint: "Кілтті құрылғыда сақтау үшін жүйелік терезеде жеке басыңызды растаңыз.",
    enabledTitle: "Face ID қосылды",
    enabledHint: "Енді осы құрылғыда бір қараумен кіруге болады.",
    resetSending: "Сұраныс жіберілуде…",
    resetSent: "Сұраныс жіберілді. Әкімші сізбен хабарласады.",
    resetSubmit: "Сұраныс жіберу",
    resetError: "Сұранысты жіберу мүмкін болмады. Кейінірек қайталап көріңіз.",
    resetNoLogin: "Логинді көрсетіңіз",
    supportSending: "Өтініш жіберілуде…",
    supportSent: "№{id} өтініш әкімшіге жіберілді",
    supportError: "Өтінішті жіберу мүмкін болмады",
    supportNetwork: "Сервер қолжетімсіз. Кейінірек қайталап көріңіз.",
    toastEnabled: "Face ID осы құрылғыда қосылды",
    toastSuccess: "Face ID арқылы кіру орындалды",
    google: {
      "google-unconfigured": "Google арқылы кіру әлі бапталмаған. Әкімшіге хабарласыңыз.",
      "google-cancelled": "Google арқылы кіру тоқтатылды.",
      "google-unlinked": "Бұл Google email аккаунтқа тіркелмеген. Әкімшіге хабарласыңыз.",
      "google-disabled": "Аккаунт өшірілген. Әкімшіге хабарласыңыз.",
      "google-error": "Google арқылы кіру мүмкін болмады. Қайталап көріңіз."
    }
  };

  const lang = () => (window.ProgressI18n && window.ProgressI18n.getLanguage && window.ProgressI18n.getLanguage() === "kk" ? "kk" : "ru");
  const M = () => (lang() === "kk" ? KK : RU);
  const T = (key) => (M()[key] != null ? M()[key] : RU[key] || "");

  /* ---------- запросы ---------- */
  async function request(url, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const init = {
      method: options.method || "GET",
      credentials: "same-origin",
      signal: controller.signal,
      headers: { Accept: "application/json" }
    };
    if (options.body != null) {
      init.headers["Content-Type"] = "application/json";
      init.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }
    try {
      const response = await fetch(url, init);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || "HTTP " + response.status);
        error.status = response.status;
        throw error;
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- вспомогательные ---------- */
  let toastTimer = 0;
  function toast(text) {
    if (!toastBox) return;
    toastBox.textContent = text;
    toastBox.hidden = false;
    requestAnimationFrame(() => toastBox.classList.add("visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastBox.classList.remove("visible");
      setTimeout(() => { toastBox.hidden = true; }, 220);
    }, 3200);
  }

  function setError(message) {
    if (!message) {
      errorBox.textContent = "";
      errorBox.classList.remove("visible");
      return;
    }
    errorBox.textContent = message;
    errorBox.classList.add("visible");
  }

  let busy = false;
  function setBusy(state) {
    busy = state;
    submitButton.disabled = state;
    submitButton.classList.toggle("is-loading", state);
    submitLabel.textContent = state ? T("loading") : T("submit");
  }

  const b64urlToBuf = (value) => {
    let text = String(value).replace(/-/g, "+").replace(/_/g, "/");
    text += "=".repeat((4 - (text.length % 4)) % 4);
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const bufToB64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const hasWebAuthn = () => !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.get && navigator.credentials.create);

  async function platformAuthenticatorAvailable() {
    try {
      if (!window.PublicKeyCredential || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      return false;
    }
  }

  function deviceLabel() {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua)) return "iPhone / iPad";
    if (/Android/.test(ua)) return "Android";
    if (/Windows/.test(ua)) return "Windows Hello";
    if (/Macintosh/.test(ua)) return "Mac (Touch ID)";
    return "Это устройство";
  }

  /* ---------- модальные окна ---------- */
  let activeModal = null;
  let previousFocus = null;

  function focusables(modal) {
    return Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.disabled && el.offsetParent !== null);
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal || !modal.hidden) return;
    previousFocus = document.activeElement;
    modal.hidden = false;
    activeModal = modal;
    document.body.classList.add("modal-open");
    const card = modal.querySelector(".modal-card");
    requestAnimationFrame(() => {
      if (card) card.focus({ preventScroll: true });
    });
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (activeModal === modal) activeModal = null;
    document.body.classList.remove("modal-open");
    if (previousFocus && typeof previousFocus.focus === "function") {
      try { previousFocus.focus({ preventScroll: true }); } catch (error) { /* noop */ }
    }
    if (id === "faceModal" && pendingRedirect) {
      pendingRedirect = false;
      location.href = "app.html";
    }
  }

  document.addEventListener("click", (event) => {
    const closer = event.target.closest("[data-close]");
    if (closer) {
      event.preventDefault();
      closeModal(closer.getAttribute("data-close"));
      return;
    }
    const opener = event.target.closest("[data-open]");
    if (opener) {
      event.preventDefault();
      const target = opener.getAttribute("data-open");
      if (target === "contactPanel") showContact(true);
      else openModal(target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!activeModal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal(activeModal.id);
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables(activeModal);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- панель обращения ---------- */
  function showContact(show) {
    form.hidden = show;
    contactPanel.hidden = !show;
    if (show) {
      const first = $("supportName");
      if (first) setTimeout(() => first.focus(), 40);
    } else if (username) {
      username.focus();
    }
  }

  $("openContact").addEventListener("click", () => showContact(true));
  $("contactBack").addEventListener("click", () => showContact(false));

  /* ---------- пароль ---------- */
  eyeButton.addEventListener("click", () => {
    const hidden = password.type === "password";
    password.type = hidden ? "text" : "password";
    eyeButton.setAttribute("aria-pressed", String(hidden));
    eyeButton.setAttribute("aria-label", T(hidden ? "hide" : "show"));
    eyeButton.title = T(hidden ? "hide" : "show");
    password.focus({ preventScroll: true });
  });

  function capsState(event) {
    capsHint.hidden = !(typeof event.getModifierState === "function" && event.getModifierState("CapsLock"));
  }
  password.addEventListener("keydown", capsState);
  password.addEventListener("keyup", capsState);
  password.addEventListener("blur", () => { capsHint.hidden = true; });

  [username, password].forEach((field) => {
    field.addEventListener("input", () => {
      if (errorBox.classList.contains("visible")) setError("");
    });
  });

  /* ---------- язык ---------- */
  function renderTexts() {
    submitLabel.textContent = busy ? T("loading") : T("submit");
    eyeButton.setAttribute("aria-label", T(password.type === "password" ? "show" : "hide"));
    eyeButton.title = T(password.type === "password" ? "show" : "hide");
    capsHint.textContent = T("caps");
    $("faceIdLabel").textContent = T("faceId");
    resetSubmit.textContent = resetState === "sending" ? T("resetSending") : T("resetSubmit");
    resetSubmit.disabled = resetState === "sending" || resetState === "sent";
    resetStatus.textContent = resetState === "sending" ? T("resetSending") : resetState === "sent" ? T("resetSent") : resetState === "error" ? resetErrorText : "";
    resetStatus.classList.toggle("success", resetState === "sent");
    paintFace();
    renderServerStatus();
  }

  if (window.ProgressI18n && window.ProgressI18n.onChange) window.ProgressI18n.onChange(renderTexts);

  /* ---------- статус сервера ---------- */
  const serverStatus = $("serverStatus");
  const serverStatusText = $("serverStatusText");

  function renderServerStatus() {
    const state = serverStatus.dataset.state || "checking";
    serverStatusText.textContent = state === "online" ? T("statusOnline") : state === "offline" ? T("statusOffline") : T("statusChecking");
  }

  async function checkServer() {
    serverStatus.dataset.state = "checking";
    renderServerStatus();
    try {
      await request("/api/health", { method: "GET" }, 6000);
      serverStatus.dataset.state = "online";
    } catch (error) {
      serverStatus.dataset.state = "offline";
    }
    renderServerStatus();
  }

  /* ---------- Face ID ---------- */
  const FACE_SCENES = {
    intro: { state: "idle", title: "faceTitle", hint: "faceHint", note: "faceNote", action: "faceAction", actionMode: "login", secondary: "facePassword" },
    scanning: { state: "scanning", title: "faceScanTitle", hint: "faceScanHint", note: "faceNote", action: "faceAction", actionMode: "none", disabled: true, secondary: "facePassword" },
    success: { state: "success", title: "faceDoneTitle", hint: "faceDoneHint", note: "faceNote", action: "faceContinue", actionMode: "continue", disabled: true, secondary: "none" },
    error: { state: "error", title: "faceErrorTitle", hint: "faceErrorHint", note: "faceNote", action: "faceRetry", actionMode: "login", secondary: "facePassword" },
    cancelled: { state: "cancelled", title: "faceCancel", hint: "faceCancelHint", note: "faceNote", action: "faceRetry", actionMode: "login", secondary: "facePassword" },
    notsetup: { state: "idle", title: "faceNoSetupTitle", hint: "faceNoSetupHint", note: "faceNote", action: "facePassword", actionMode: "password", secondary: "none" },
    unsupported: { state: "idle", title: "faceNoSupportTitle", hint: "faceNoSupportHint", note: "faceNoSupportNote", action: "facePassword", actionMode: "password", secondary: "none" },
    "enable-intro": { state: "idle", title: "enableTitle", hint: "enableHint", note: "enableNote", action: "enableAction", actionMode: "register", secondary: "enableSkip" },
    "enable-working": { state: "scanning", title: "enableWorkTitle", hint: "enableWorkHint", note: "enableNote", action: "enableAction", actionMode: "none", disabled: true, secondary: "enableSkip" },
    "enable-error": { state: "error", title: "faceErrorTitle", hint: "faceErrorHint", note: "enableNote", action: "enableAction", actionMode: "register", secondary: "enableSkip" },
    "enable-success": { state: "success", title: "enabledTitle", hint: "enabledHint", note: "enableNote", action: "faceContinue", actionMode: "continue", disabled: true, secondary: "none" }
  };

  let faceScene = "intro";
  let faceErrorText = "";
  let faceMode = "login";
  let faceBusy = false;
  let pendingRedirect = false;

  function paintFace() {
    if (!faceScene) return;
    const scene = FACE_SCENES[faceScene] || FACE_SCENES.intro;
    scan.dataset.state = scene.state;
    faceTitle.textContent = faceErrorText && faceScene === "error" ? faceErrorText : T(scene.title);
    faceHint.textContent = T(scene.hint);
    faceNote.textContent = T(scene.note);
    faceNote.hidden = !scene.note;
    faceAction.textContent = T(scene.action);
    faceAction.disabled = !!scene.disabled;
    facePassword.textContent = scene.secondary === "none" ? "" : T(scene.secondary);
    facePassword.hidden = scene.secondary === "none";
  }

  function setFaceScene(next, errorText) {
    faceScene = next;
    faceErrorText = errorText || "";
    paintFace();
  }

  async function openFaceLogin() {
    faceMode = "login";
    pendingRedirect = false;
    faceErrorText = "";
    setFaceScene("intro");
    openModal("faceModal");
    if (!hasWebAuthn()) {
      setFaceScene("unsupported");
      return;
    }
    setFaceScene("intro");
  }

  async function faceLogin() {
    if (faceBusy) return;
    if (!hasWebAuthn()) {
      setFaceScene("unsupported");
      return;
    }
    faceBusy = true;
    setFaceScene("scanning");
    try {
      const options = await request("/api/webauthn/login-options", { method: "POST", body: {} }, 10000);
      const publicKey = options.publicKey;
      publicKey.challenge = b64urlToBuf(publicKey.challenge);
      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) throw new Error(T("faceCancel"));
      await request("/api/webauthn/login", {
        method: "POST",
        body: {
          id: credential.id,
          response: {
            clientDataJSON: bufToB64url(credential.response.clientDataJSON),
            authenticatorData: bufToB64url(credential.response.authenticatorData),
            signature: bufToB64url(credential.response.signature),
            userHandle: credential.response.userHandle ? bufToB64url(credential.response.userHandle) : null
          }
        }
      }, 15000);
      setFaceScene("success");
      toast(T("toastSuccess"));
      setTimeout(() => { location.href = "app.html"; }, 850);
    } catch (error) {
      const name = error && error.name;
      if (error && error.status === 404) {
        setFaceScene("notsetup");
      } else if (name === "NotAllowedError" || name === "AbortError") {
        setFaceScene("cancelled");
      } else if (name === "SecurityError" || name === "NotSupportedError") {
        setFaceScene("unsupported");
      } else if (error && error.status === 401) {
        setFaceScene("error");
        faceHint.textContent = error.message || T("faceErrorHint");
      } else {
        setFaceScene("error");
        if (error && error.status) faceHint.textContent = error.message;
      }
    } finally {
      faceBusy = false;
    }
  }

  async function faceRegister() {
    if (faceBusy) return;
    faceBusy = true;
    setFaceScene("enable-working");
    try {
      const options = await request("/api/webauthn/register-options", { method: "POST", body: {} }, 10000);
      const publicKey = options.publicKey;
      publicKey.challenge = b64urlToBuf(publicKey.challenge);
      publicKey.user.id = b64urlToBuf(publicKey.user.id);
      publicKey.excludeCredentials = (publicKey.excludeCredentials || []).map((item) => Object.assign({}, item, { id: b64urlToBuf(item.id) }));
      const credential = await navigator.credentials.create({ publicKey });
      if (!credential) throw new Error(T("faceErrorHint"));
      await request("/api/webauthn/register", {
        method: "POST",
        body: {
          label: deviceLabel(),
          credential: {
            id: credential.id,
            type: credential.type,
            response: {
              clientDataJSON: bufToB64url(credential.response.clientDataJSON),
              attestationObject: bufToB64url(credential.response.attestationObject)
            }
          }
        }
      }, 15000);
      pendingRedirect = true;
      setFaceScene("enable-success");
      toast(T("toastEnabled"));
      setTimeout(() => {
        if (pendingRedirect) {
          pendingRedirect = false;
          location.href = "app.html";
        }
      }, 1000);
    } catch (error) {
      if (error && (error.name === "NotAllowedError" || error.name === "AbortError")) {
        setFaceScene("enable-intro");
        return;
      }
      if (error && (error.name === "SecurityError" || error.name === "NotSupportedError")) {
        setFaceScene("unsupported");
        return;
      }
      setFaceScene("enable-error");
      if (error && error.status) faceHint.textContent = error.message;
    } finally {
      faceBusy = false;
    }
  }

  $("faceIdBtn").addEventListener("click", openFaceLogin);

  faceAction.addEventListener("click", () => {
    const scene = FACE_SCENES[faceScene] || {};
    if (scene.actionMode === "login") faceLogin();
    else if (scene.actionMode === "register") faceRegister();
    else if (scene.actionMode === "password") closeModal("faceModal");
    else if (scene.actionMode === "continue") location.href = "app.html";
  });

  facePassword.addEventListener("click", () => closeModal("faceModal"));

  async function offerFaceRegister() {
    if (!hasWebAuthn()) return false;
    const available = await platformAuthenticatorAvailable();
    if (!available) return false;
    try {
      const data = await request("/api/webauthn/credentials", { method: "GET" }, 6000);
      return !(data.credentials && data.credentials.length);
    } catch (error) {
      return false;
    }
  }

  /* ---------- восстановление доступа ---------- */
  let resetState = "idle";
  let resetErrorText = "";

  function openReset() {
    resetLogin.value = username.value.trim() || savedLogin || "";
    resetContact.value = "";
    resetState = "idle";
    resetErrorText = "";
    resetStatus.textContent = "";
    resetStatus.classList.remove("success");
    resetSubmit.disabled = false;
    resetSubmit.textContent = T("resetSubmit");
    openModal("resetModal");
    setTimeout(() => resetLogin.focus(), 60);
  }

  $("forgotBtn").addEventListener("click", openReset);

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (resetState === "sending") return;
    const loginValue = resetLogin.value.trim();
    if (loginValue.length < 2) {
      resetState = "error";
      resetErrorText = T("resetNoLogin");
      resetStatus.textContent = resetErrorText;
      resetStatus.classList.remove("success");
      resetLogin.focus();
      return;
    }
    resetState = "sending";
    resetErrorText = "";
    resetSubmit.disabled = true;
    resetSubmit.textContent = T("resetSending");
    resetStatus.textContent = T("resetSending");
    resetStatus.classList.remove("success");
    try {
      await request("/api/password-reset", { method: "POST", body: { login: loginValue, contact: resetContact.value.trim() } }, 12000);
      resetState = "sent";
      resetStatus.textContent = T("resetSent");
      resetStatus.classList.add("success");
      resetSubmit.textContent = T("resetSubmit");
      resetSubmit.disabled = true;
      toast(T("resetSent"));
    } catch (error) {
      resetState = "error";
      resetErrorText = error && error.status ? error.message : T("resetError");
      resetStatus.textContent = resetErrorText;
      resetStatus.classList.remove("success");
      resetSubmit.textContent = T("resetSubmit");
      resetSubmit.disabled = false;
    }
  });

  /* ---------- поддержка ---------- */
  supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("supportSubmit");
    const status = $("supportStatus");
    const data = Object.fromEntries(new FormData(supportForm).entries());
    button.disabled = true;
    status.textContent = T("supportSending");
    status.classList.remove("success");
    try {
      const result = await request("/api/support-requests", { method: "POST", body: data }, 15000);
      supportForm.reset();
      status.textContent = T("supportSent").replace("{id}", result.id);
      status.classList.add("success");
    } catch (error) {
      status.textContent = error && error.status ? error.message : T("supportNetwork");
      status.classList.remove("success");
    } finally {
      button.disabled = false;
    }
  });

  /* ---------- вход по паролю ---------- */
  if (savedLogin) {
    username.value = savedLogin;
    remember.checked = true;
    $("supportLogin").value = savedLogin;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const login = username.value.trim();
    const passwordValue = password.value;

    if (!login || !passwordValue) {
      setError(T("empty"));
      return;
    }
    if (passwordValue.length < 8) {
      setError(T("short"));
      return;
    }

    if (remember.checked) localStorage.setItem("progress-last-login", login);
    else localStorage.removeItem("progress-last-login");

    setError("");
    setBusy(true);
    try {
      await request("/api/login", { method: "POST", body: { login, password: passwordValue } }, 15000);
      if (await offerFaceRegister()) {
        faceMode = "enable";
        pendingRedirect = true;
        openModal("faceModal");
        setFaceScene("enable-intro");
      } else {
        location.href = "app.html";
      }
    } catch (error) {
      if (error && error.status === 401) setError(T("bad"));
      else if (error && error.status === 429) setError(error.message);
      else if (error && error.status) setError(error.message);
      else if (error && error.name === "AbortError") setError(T("network"));
      else setError(T("network"));
    } finally {
      setBusy(false);
    }
  });

  /* ---------- старт ---------- */
  const authState = new URLSearchParams(location.search).get("auth");
  if (authState) {
    const google = M().google || {};
    setError(google[authState] || google["google-error"]);
    history.replaceState(null, "", location.pathname);
  }

  renderTexts();
  checkServer();
})();
