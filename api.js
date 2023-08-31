const host = "https://wedev-api.sky.pro/api/v2/alexeirybak14/comments";

// ---------- Получаем список имеющихся комментариев --------------------------
export async function getApiComments({ token }) {
  return fetch(host, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  }).then((response) => {
    if (response.status === 401) {
      throw new Error("Нет авторизации");
    }
    if (response.status === 500) {
      throw new Error("Сервер сломался, попробуйте позже");
    }
    return response.json();
  });
}

// ---------- Отправляем POST-запрос на сервер, чтобы добавить комментарий ----
export async function addApiComments({ text, token }) {
  return fetch(host, {
    method: "POST",
    body: JSON.stringify({
      text,
    }),
    headers: {
      Authorization: token,
    },
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Комментарий должен быть не короче 3 символов");
    }
    if (response.status === 500) {
      throw new Error("Сервер сломался, попробуй позже");
    }
    return response.json();
  });
}

// ---------- Отправляем исправление поста ------------------------------------
export async function answerApiComments({ text, token }) {
  return fetch(host, {
    method: "POST",
    body: JSON.stringify({
      text: `Отредактировал(а): ${text}`.replaceAll(
        "Отредактировал(а): Отредактировал(а):",
        "Отредактировал(а):"
      ),
    }),
    headers: {
      Authorization: token,
    },
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Комментарий должен быть не короче 3 символов");
    }
    if (response.status === 500) {
      throw new Error("Сервер сломался, попробуй позже");
    }
    return response.json();
  });
}

// ---------- Отправляем POST-запрос на сервер, чтобы авторизовать пользователя
export async function loginUser({ login, password }) {
  return fetch("https://wedev-api.sky.pro/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Неверный логин или пароль");
    }
    return response.json();
  });
}

// ---------- Отправляем POST-запрос на сервер, чтобы зарегистрировать нового пользователя ---
export async function regUser({ login, password, name }) {
  return fetch("https://wedev-api.sky.pro/api/user", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
      name,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Такой пользователь уже существует");
    }
    return response.json();
  });
}

// ---------- Удаляем комментарий ---------------------------------------------
export function deleteApiComments(id, token) {
  return fetch(`${host}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token,
    },
  });
}

// ---------- Запоминаем лайки ------------------------------------------------
export async function addLike(token, id) {
  return fetch(`${host}/${id}/toggle-like`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  }).then((response) => {
    return response.json();
  });
}
