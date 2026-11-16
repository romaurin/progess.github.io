(() => {
  const form = document.getElementById("f");
  const username = document.getElementById("em");
  const password = document.getElementById("pw");
  const eyeButton = document.getElementById("eye");
  const remember = document.getElementById("remember");
  const errorBox = document.getElementById("e");
  const submitButton = form.querySelector(".go");
  const contactPanel = document.getElementById("contactPanel");
  const supportForm = document.getElementById("supportForm");
  const savedLogin = localStorage.getItem("progress-last-login");

  const messages = {
    ru: {
      show: "Показать",
      hide: "Скрыть",
      empty: "Введите логин и пароль",
      short: "Пароль должен содержать не меньше 8 символов",
      login: "Проверьте логин и попробуйте ещё раз",
      unavailable: "Сервер недоступен. Запустите его командой: node server.js",
      loading: "Входим...",
      submit: "Войти в личный кабинет",
      google: {
        "google-unconfigured": "Вход через Google пока не настроен. Обратитесь к администратору.",
        "google-cancelled": "Вход через Google отменён.",
        "google-unlinked": "Этот Google email не привязан к аккаунту. Обратитесь к администратору.",
        "google-disabled": "Аккаунт отключён. Обратитесь к администратору.",
        "google-error": "Не удалось войти через Google. Попробуйте ещё раз."
      }
    },
    kk: {
      show: "Көрсету",
      hide: "Жасыру",
      empty: "Логин мен құпиясөзді енгізіңіз",
      short: "Құпиясөз кемінде 8 таңбадан тұруы керек",
      login: "Логинді тексеріп, қайта көріңіз",
      unavailable: "Сервер қолжетімсіз. Команданы іске қосыңыз: node server.js",
      loading: "Кіру...",
      submit: "Жеке кабинетке кіру",
      google: {
        "google-unconfigured": "Google арқылы кіру әлі бапталмаған. Әкімшіге хабарласыңыз.",
        "google-cancelled": "Google арқылы кіру тоқтатылды.",
        "google-unlinked": "Бұл Google email аккаунтқа тіркелмеген. Әкімшіге хабарласыңыз.",
        "google-disabled": "Аккаунт өшірілген. Әкімшіге хабарласыңыз.",
        "google-error": "Google арқылы кіру мүмкін болмады. Қайталап көріңіз."
      }
    }
  };

  const getCurrentMessages = () => {
    const lang = (window.ProgressI18n && window.ProgressI18n.getLanguage && window.ProgressI18n.getLanguage()) || "ru";
    return messages[lang] || messages.ru;
  };

  function setError(message) {
    if (!message) {
      errorBox.textContent = "";
      errorBox.classList.remove("visible");
      return;
    }

    errorBox.textContent = message;
    errorBox.classList.add("visible");
  }

  function setSubmitState(isLoading) {
    const currentMessages = getCurrentMessages();
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? currentMessages.loading : currentMessages.submit;
  }

  if (savedLogin) {
    username.value = savedLogin;
    remember.checked = true;
    document.getElementById("supportLogin").value = savedLogin;
  }

  document.getElementById("openContact").addEventListener("click", (event) => {
    event.preventDefault();
    form.hidden = true;
    contactPanel.hidden = false;
    document.getElementById("supportName").focus();
  });

  document.getElementById("contactBack").addEventListener("click", () => {
    contactPanel.hidden = true;
    form.hidden = false;
    username.focus();
  });

  supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("supportSubmit");
    const status = document.getElementById("supportStatus");
    const data = Object.fromEntries(new FormData(supportForm).entries());
    button.disabled = true;
    status.textContent = "Отправляем обращение...";
    status.classList.remove("success");
    try {
      const response = await fetch("/api/support-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось отправить обращение");
      supportForm.reset();
      status.textContent = `Обращение №${result.id} передано администратору`;
      status.classList.add("success");
    } catch (error) {
      status.textContent = error.message || "Сервер недоступен. Попробуйте позже.";
    } finally {
      button.disabled = false;
    }
  });

  eyeButton.addEventListener("click", () => {
    const currentMessages = getCurrentMessages();
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";
    eyeButton.textContent = isHidden ? currentMessages.hide : currentMessages.show;
    eyeButton.setAttribute("aria-label", isHidden ? "Скрыть пароль" : "Показать пароль");
  });

  eyeButton.textContent = getCurrentMessages().show;
  submitButton.textContent = getCurrentMessages().submit;

  const authState = new URLSearchParams(location.search).get("auth");
  if (authState) {
    const currentMessages = getCurrentMessages();
    setError((currentMessages.google && currentMessages.google[authState]) || currentMessages.google["google-error"]);
    history.replaceState(null, "", location.pathname);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentMessages = getCurrentMessages();
    const login = username.value.trim();
    const passwordValue = password.value;

    if (!login || !passwordValue) {
      setError(currentMessages.empty);
      return;
    }

    if (passwordValue.length < 8) {
      setError(currentMessages.short);
      return;
    }

    if (remember.checked) {
      localStorage.setItem("progress-last-login", login);
    } else {
      localStorage.removeItem("progress-last-login");
    }

    setError("");
    setSubmitState(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ login, password: passwordValue })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || currentMessages.login);
      }

      location.href = "app.html";
    } catch (error) {
      setError(error.message || currentMessages.unavailable);
    } finally {
      setSubmitState(false);
    }
  });
})();
