const submitBtn = document.getElementById("submit-btn")
const fileInput = document.getElementById("file-upload-input")
const spinner = submitBtn.querySelector(".spinner")
const buttonText = submitBtn.querySelector(".button-text")
const exitFullscreenBtn = document.querySelector("#chat-options .exit-fullscreen")
const chatMessagesEle = document.getElementById("chat-messages")
const filesList = document.getElementById("uploaded-files-list")

const MIN_CHATBOX_HEIGHT = 100
const USER_ID = getLocalUserId()

// ============================= pick file section =============================
class UploadFilesSocket {
  #socket = null
  #progressBar = null

  constructor() {
    this.#socket = io()
    this.#progressBar = document.getElementById("upload-progress-bar")
    this.#registerListeners()
  }

  #registerListeners() {
    this.#socket.on("upload_progress", (data) => {
      const progress = Math.round(data.progress)
      this.#progressBar.querySelector(".progress-bar-fill").style.width = `${progress}%`
      this.#progressBar.querySelector(".progress-text").textContent = `${progress}%`
    })
  }

  showProgress() {
    this.#progressBar.querySelector(".progress-bar-fill").style.width = "0%"
    this.#progressBar.querySelector(".progress-text").textContent = "0%"
    this.#progressBar.hidden = false
  }

  hideProgress() {
    this.#progressBar.hidden = true
  }
}

const uploadFilesSocket = new UploadFilesSocket()

const onPickFile = () => {
  const files = fileInput.files
  if (files && files.length > 0) {
    notice(null)
    indicatePickedFiles()
    uploadFilesSocket.hideProgress()
  }
}

const indicatePickedFiles = () => {
  const filesListEle = document.getElementById("picked-files")
  filesListEle.hidden = false
  const list = filesListEle.querySelector("ol")
  list.innerHTML = "" // Xóa danh sách hiện tại
  const files = fileInput.files
  if (files && files.length > 0) {
    for (const file of files) {
      const fileItem = document.createElement("li")
      fileItem.title = file.name
      fileItem.className = "picked-file-item"
      fileItem.textContent = file.name.length > 50 ? `${file.name.slice(0, 50)}...` : file.name
      list.appendChild(fileItem)
    }
  }
}

/**
 * Displays a notification message to the user.
 * @param {string} type - The type of the message. Pass `success` for a success message, or `error` for an error message, or `null` to hide the message.
 * @param {string} msg - The message to display. If the message exceeds 200 characters, it will be truncated with an ellipsis.
 */
const notice = (type, msg) => {
  const statusMessage = document.getElementById("status-message")
  statusMessage.classList.remove("success", "error")
  if (type === "success") {
    statusMessage.classList.add("success")
  } else if (type === "error") {
    statusMessage.classList.add("error")
  } else {
    statusMessage.hidden = true
    return
  }
  const statusMessageContent = statusMessage.querySelector(".content")
  if (msg && msg.length > 0) {
    statusMessage.hidden = false
    statusMessageContent.textContent = msg.length > 200 ? `${msg.slice(0, 200)} ...` : msg
  }
}

const addUploadedFile = (file) => {
  const { name } = file
  const newFile = document.createElement("li")
  newFile.innerHTML = `<a class="file-to-download new-file" href="/download/${name}">${name}</a>`
  filesList.appendChild(newFile)
}

const submitFiles = async (e) => {
  e.preventDefault()

  if (!fileInput.files.length) {
    notice("error", "Please select a file to upload.")
    return
  }

  const files = fileInput.files
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }

  // Show progress bar
  uploadFilesSocket.showProgress()

  // Hiển thị spinner
  spinner.hidden = false
  buttonText.hidden = true

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
      headers: {
        "X-User-Id": USER_ID,
      },
    })

    if (response.ok) {
      notice("success", "File uploaded successfully!")

      // Thêm file mới vào danh sách
      for (const file of files) {
        addUploadedFile(file)
      }
    } else {
      const errorText = await response.text()
      notice("error", `Upload failed: ${errorText}`)
    }
  } catch (error) {
    notice("error", "An error occurred during the upload.")
  } finally {
    // Ẩn spinner và progress bar
    spinner.hidden = true
    buttonText.hidden = false
  }
}

// ============================= chatting section =============================
class ChatSocket {
  socket = null

  constructor(namespace) {
    this.socket = io(namespace, {
      auth: {
        user_id: USER_ID,
      },
    })
    this.#registerListeners()
  }

  sendMessage(message, callback) {
    this.socket.emit("send_message", { sender_id: getLocalUserId(), content: message }, (res) => {
      if (callback) {
        callback(res)
      }
    })
  }

  sendMedia(media, callback) {
    this.socket.emit("send_message", { sender_id: getLocalUserId(), media }, (res) => {
      if (callback) {
        callback(res)
      }
    })
  }

  #registerListeners() {
    // Hiển thị tất cả tin nhắn khi client tải lại trang
    this.socket.on("load_messages", (messages) => {
      chatMessagesEle.innerHTML = "" // Xóa danh sách hiện tại
      for (const message of messages) {
        const { img_url, sender_id, content, timestamp } = message
        if (img_url) {
          attachImages(img_url, sender_id)
        } else {
          chatMessagesEle.appendChild(
            createMessageTextBar(content, sender_id, dayjs(timestamp).format("HH:mm"))
          )
        }
      }
      scrollToBottomMessage()
    })

    // Xử lý sự kiện message từ namespace /chat
    this.socket.on("message", (data) => {
      const { img_url, sender_id, content, timestamp } = data
      if (img_url) {
        attachImages(img_url, sender_id)
      } else {
        chatMessagesEle.appendChild(
          createMessageTextBar(content, sender_id, dayjs(timestamp).format("HH:mm"))
        )
      }
      scrollToBottomMessage()
    })

    // Cập nhật trạng thái các client trong mạng
    this.socket.on("clients_update", (data) => {
      const { total_clients } = data
      if (total_clients) {
        document.getElementById("clients-state").textContent = `Total connected clients: ${
          total_clients || 0
        }`
      }
    })
  }
}

const chatSocket = new ChatSocket("/chatting")

const attachImages = (img_url, sender_id) => {
  const imgWrapper = document.createElement("div")
  imgWrapper.classList.add("img-message-wrapper")
  if (getLocalUserId() === sender_id) {
    imgWrapper.classList.add("self")
  }
  const imgEle = document.createElement("img")
  imgEle.classList.add("img-message")
  imgEle.src = img_url
  imgEle.alt = "Image Message"

  imgWrapper.appendChild(imgEle)
  chatMessagesEle.appendChild(imgWrapper)
}

const scrollToBottomMessage = () => {
  const messagesList = document.getElementById("chat-messages-container")
  messagesList.scrollTop = messagesList.scrollHeight
}

const createMessageTextBar = (messageContent, senderId, timestamp) => {
  const newMessage = document.createElement("div")
  newMessage.className = "message-text-bar"
  if (getLocalUserId() === senderId) {
    newMessage.classList.add("self")
  }
  newMessage.innerHTML = `
    <span class="content">${messageContent}</span>
    <span class="msg-timestamp">${timestamp}</span>`
  return newMessage
}

const pickMediaInChatting = (target) => {
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      chatSocket.sendMedia(
        {
          file_name: file.name,
          file_content: reader.result, // Lấy nội dung base64
        },
        () => {
          addUploadedFile(file)
        }
      )
    }
    reader.onerror = (err) => {
      alert("Lỗi khi đọc file")
    }
    reader.readAsArrayBuffer(file)
  }
}

// Gửi tin nhắn tới namespace /chat
const sendMessageHandler = (target) => {
  const messageTextField = target.closest(".message-textfield-container")
  let input = messageTextField.querySelector("input[name='message']")
  if (!input) {
    input = messageTextField.querySelector("textarea[name='notepad']")
  }
  const message = input.value
  if (message) {
    if (message.trim().length > 0) {
      chatSocket.sendMessage(message)
    }
    input.value = ""
  }
}

const showNotepadModal = () => {
  const modalEle = document.getElementById("notepad-modal")
  const showModal = modalEle.getAttribute("data-show-modal") === "true"
  modalEle.hidden = showModal
  modalEle.setAttribute("data-show-modal", `${!showModal}`)
  if (!showModal) {
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = "auto"
  }
}

const catchCtrlEnter_notepad = (e) => {
  const key = e.key
  if (key === "Enter" && e.ctrlKey) {
    e.preventDefault()
    sendMessageHandler(e.target)
  }
}

const switchRoutes = (route) => {
  const coinsEle = document.querySelector("#switch-btns .coins")
  coinsEle.classList.toggle("flipped")
  const routesEle = document.querySelectorAll("main .route")
  for (const routeEle of routesEle) {
    routeEle.hidden = true
  }
  document.querySelector("main .route." + route).hidden = false
}

const handleFullscreenChatBox = () => {
  const chatBox = document.getElementById("chat-box")
  if (document.fullscreenElement) {
    // Thoát khỏi chế độ toàn màn hình
    exitFullscreenBtn.hidden = true
    document.exitFullscreen()
  } else {
    // Kích hoạt chế độ toàn màn hình
    chatBox
      .requestFullscreen()
      .then(() => {
        exitFullscreenBtn.hidden = false
      })
      .catch((err) => {
        alert(`Lỗi: Không thể chuyển sang toàn màn hình! ${err.message}`)
      })
  }
}

const showMoreOptionsList = () => {
  const moreOptionsList = document.getElementById("more-options-list")
  moreOptionsList.classList.toggle("active")
}

const catchEnter_sendMessage = (e) => {
  const key = e.key
  if (key === "Enter") {
    e.preventDefault()
    sendMessageHandler(e.target)
  }
}

const adjustChatBoxHeight = (target) => {
  const input = target
    .closest(".message-textfield-container")
    .querySelector("input[name='adjust-chatbox-height']")
  const height = input.value
  const chatbox = document.getElementById("chat-box")
  if (height < MIN_CHATBOX_HEIGHT) {
    chatbox.style.height = `${MIN_CHATBOX_HEIGHT}px`
  } else {
    chatbox.style.height = `${height}px`
  }
}

const showAdjustChatBoxHeightModal = () => {
  const modalEle = document.getElementById("adjust-chatbox-height-modal")
  const showModal = modalEle.getAttribute("data-show-modal") === "true"
  modalEle.hidden = showModal
  modalEle.setAttribute("data-show-modal", `${!showModal}`)
  if (!showModal) {
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = "auto"
  }
}

const catchEnter_adjustChatboxHeight = (e) => {
  const key = e.key
  if (key === "Enter") {
    e.preventDefault()
    adjustChatBoxHeight(e.target)
  }
}

const initListeners = () => {
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      exitFullscreenBtn.hidden = false
    } else {
      exitFullscreenBtn.hidden = true
    }
  })
}
initListeners()
