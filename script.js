import {
  addApiComments,
  getApiComments,
  answerApiComments,
  deleteApiComments,
  addLike,
} from "./api.js";
import { renderLogin, userName } from "./components/login-component.js";

// ---------- Собираем переменные ---------------------------------------------
let token = null;
let comments = [];
let initialLoading = true;
let isLoadingAdd = false;

// ---------- Получаем список комментариев с API -----------------------------
export const getComments = async () => {
  if (initialLoading) {
    document.getElementById("app").innerHTML = `<div class="preloader">
  <div class="preloader-image">Приложение загружается</div></div>`;
  }
  return getApiComments({ token }).then((responseData) => {
    const appComments = responseData.comments.map((comment) => {
      return {
        date: new Date(comment.date),
        name: comment.author.name,
        id: comment.id,
        text: comment.text,
        likes: comment.likes,
        isLiked: comment.isLiked,
        isLikeLoading: false,
      };
    });
    comments = appComments;
    initialLoading = false;
    renderComments();
  });
};

getComments();

// -------- Форматируем дату --------------------------------------------------
function formatDate(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  const hours = ("0" + date.getHours()).slice(-2);
  const minutes = ("0" + date.getMinutes()).slice(-2);
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// ---------- Безопасность ----------------------------------------------------
const sanitizeHtml = (htmlString) => {
  return htmlString
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("QUOTE_BEGIN", '<div class="quote">')
    .replaceAll("QUOTE_END", "</div>");
};

// ---------- Рендеринг коментария --------------------------------------------
const renderComments = () => {
  const appEl = document.getElementById("app");
  const commentHTML = comments
    .map((comment, index) => {
      return `<li data-index="${index}" class="comment">
          <div class="comment-header">
            <div class="comment-name">${sanitizeHtml(comment.name)}</div>
            <div>${formatDate(new Date(comment.date))}</div>
          </div>
          <div class="comment-body">
            <div class="comment-text">${sanitizeHtml(comment.text)}</div>
          </div>
          <div class="comment-footer">
          <button data-edit="${index}" class="edit-button">Редактировать</button>
          <button data-id="${index}" class="delete-button" id="button-delete">Удалить</button>
            <div class="likes">
            <span class="likes-counter">${comment.likes}</span>
          <button data-id="${
            comment.id
          }" data-index="${index}" class="like-button ${
        comment.isLiked ? "-active-like" : "-non-active-like"
      } ${comment.isLikeLoading ? "-loading-like" : ""}"></button></div></div>
          </li>`;
    })
    .join("");

  if (!token) {
    const appHtml = `<ul class="comments">
            ${commentHTML}
            </ul>
            <p class="warning">Чтобы добавить комментарий, <button class="login-button">авторизуйтесь</button></p>`;
    appEl.innerHTML = appHtml;

    document.querySelector(".login-button").addEventListener("click", () => {
      renderLogin({
        appEl,
        setToken: (newToken) => {
          token = newToken;
        },
        getComments,
      });
    });
    return;
  }

  const appHtml = `<ul class="comments">
                ${commentHTML}
                </ul>
                <div class="add-form-row">
                </div>
                <div class="add-form" id="add-comment">
                  <input
                    type="text"
                    class="add-form-name"
                    placeholder="Введите ваше имя"
                    disabled
                    value="${userName}"
                    id="name-input"
                    disabled/>
                  <textarea
                    type="textarea"
                    class="add-form-text"
                    placeholder="Введите ваш комментарий"
                    rows="4"
                    id="text-input"
                  ></textarea>
                  <div class="add-form-row">
                    <button class="add-form-button" id="button-add">Написать</button>
                  </div>
                </div>
                <div class="preloader">
                  <div id="form-loading" class="hidden">Комментарий загружается</div>
                </div>`;

  appEl.innerHTML = appHtml;

  const buttonElement = document.getElementById("button-add");
  const nameInputElement = document.getElementById("name-input");
  const textInputElement = document.getElementById("text-input");
  buttonElement.classList.add("empty");
  buttonElement.disabled = true;
  const loadingElement = document.getElementById("form-loading");
  loadingElement.classList.add("preloader-image");

  // ---------- Отвечаем на комментарий -----------------------------------------
  function answerComment() {
    const oldComments = document.querySelectorAll(".comment");
    oldComments.forEach((oldComment) => {
      oldComment.addEventListener("click", (event) => {
        event.stopPropagation();
        const index = oldComment.dataset.index;
        textInputElement.value = `QUOTE_BEGIN ${comments[index].text}\n${comments[index].name} QUOTE_END`;
      });
    });
  }

  // ---------- Удаляем комментаий ----------------------------------------------
  const deleteButtonElements = document.querySelectorAll(".delete-button");
  deleteButtonElements.forEach((deleteButtonElement) => {
    deleteButtonElement.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = deleteButtonElement.dataset.id;
      deleteApiComments(comments[index].id, token).then(() => {
        return getComments();
      });
    });
  });

  // --------- Добавляем комментарий --------------------------------------------
  const addComment = () => {
    isLoadingAdd = true;
    renderForm(isLoadingAdd);

    addApiComments({
      text: textInputElement.value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;"),
      token,
    })
      .then(() => {
        return getComments();
      })
      .then(() => {
        isLoadingAdd = false;
        renderForm(isLoadingAdd);
        nameInputElement.value = "";
        textInputElement.value = "";
        buttonElement.classList.add("empty");
        buttonElement.disabled = true;
      })
      .catch((error) => {
        isLoadingAdd = false;
        renderForm(isLoadingAdd);
        alert(error.message);
      });
  };

  // ---------- Деактивируем кнопку, пока поля ввода пустые ---------------------
  const handleInput = () => {
    if (
      nameInputElement.value.trim() !== "" &&
      textInputElement.value.trim() !== ""
    ) {
      /* Заодно проверим, чтобы не вводились одни пробелы*/
      buttonElement.disabled = false;
      buttonElement.classList.remove("empty");
    } else {
      buttonElement.disabled = true;
      buttonElement.classList.add("empty");
    }
  };

  nameInputElement.addEventListener("input", handleInput);
  textInputElement.addEventListener("input", handleInput);
  buttonElement.addEventListener("click", addComment);
  textInputElement.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addComment();
    }
  });

  counterLikes();
  answerComment();

  // ---------- Редактирование комментария --------------------------------------
  const editButtonElements = document.querySelectorAll(".edit-button");
  editButtonElements.forEach((editButtonElement) => {
    editButtonElement.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = editButtonElement.dataset.edit;
      console.log(index);

      if (editButtonElements[index].innerHTML === "Редактировать") {
        editButtonElements[index].innerHTML = "Сохранить";
        const commentBodyElements = document.querySelectorAll(".comment-text");
        const commentBodyElement = commentBodyElements[index];
        commentBodyElement.innerHTML = `<textarea type="textarea" class="edit-comment" rows="4">${comments[index].text}</textarea>`;
      } else {
        const redactCommentElement = document.querySelectorAll(".edit-comment");
        console.log(redactCommentElement);
        comments[index].text = redactCommentElement[0].value;

        deleteApiComments(comments[index].id, token).then(() => {
          getComments();
        });

        answerApiComments({
          text: comments[index].text
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;"),
          token,
        })
          .then(() => {})
          .then(() => {
            getComments();
            renderComments();
          });
        renderComments();
      }
    });
  });
};

// ---------- Ставим лайки ----------------------------------------------------
function counterLikes() {
  const likesButtonElements = document.querySelectorAll(".like-button");

  likesButtonElements.forEach((likesButtonElement) => {
    likesButtonElement.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = likesButtonElement.dataset.index;
      const commentId = comments[index].id;

      addLike(token, commentId).then(() => {
        return getComments();
      });
    });
  });
}

// ---------- Работа с формой загрузки комментария ----------------------------
const renderForm = (isLoading) => {
  const formWindow = document.querySelector(".add-form");
  const loaderText = document.getElementById("form-loading");

  if (isLoading) {
    loaderText.classList.remove("hidden");
    formWindow.classList.add("hidden");
  } else {
    loaderText.classList.add("hidden");
    formWindow.classList.remove("hidden");
  }
};
