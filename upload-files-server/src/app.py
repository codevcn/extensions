from flask import (
    Flask,
    render_template,
    request,
    Response,
    jsonify,
)
import os
from configs import STORAGE_FOLDER, HOME_PAGE, NOT_FOUND_PAGE
from utils import write_message_mode_w, clear_actions_log, get_client_ip
from flask_socketio import SocketIO, emit, send, Namespace
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["SECRET_KEY"] = "yuukdGtne040oe5QwxhWnF0Y"
socketio = SocketIO(app, max_http_buffer_size=50 * 1024 * 1024)  # 50 MB

# Clear actions log when server starts
clear_actions_log()

# Biến lưu trữ tất cả tin nhắn
chat_messages = []
chat_clients = []


@app.route("/")
def index():
    files = [
        f
        for f in os.listdir(STORAGE_FOLDER)
        if os.path.isfile(os.path.join(STORAGE_FOLDER, f))
    ]
    write_message_mode_w("Ready!", ip=get_client_ip())
    return render_template(HOME_PAGE, files=files)


@app.route("/upload", methods=["POST"])
def upload_files():
    if "files" not in request.files:
        return "No files part", 400
    files = request.files.getlist("files")
    if not files or len(files) == 0:
        return "No selected files", 400

    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return "No user id", 400

    socket_id = None
    for client in chat_clients:
        if client.user_id == user_id:
            socket_id = client.socket_id
            break

    total_files = len(files)
    current_total_progress = 0
    emit_threshold = 5
    current_percent_progress = 0
    pre_percent_progress = 0

    for file in files:
        filename = file.filename
        if not filename or filename == "":
            filename = "Unknown"
        safe_filename = secure_filename(filename)
        file_path = os.path.join(STORAGE_FOLDER, safe_filename)

        if socket_id:
            # Get file size
            file.seek(0, os.SEEK_END)
            total_size = file.tell()
            file.seek(0)

            # Save file with progress tracking
            with open(file_path, "wb") as f:
                bytes_written = 0
                progress_delta = 0
                pre_progress = 0
                while True:
                    chunk = file.read(8192)  # Read in 8KB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                    bytes_written += len(chunk)
                    progress = (bytes_written / total_size) * 100
                    progress_delta = progress - pre_progress
                    pre_progress = progress
                    current_total_progress += progress_delta
                    percent_progress = (
                        current_total_progress / (total_files * 100)
                    ) * 100
                    if percent_progress - pre_percent_progress > emit_threshold:
                        socketio.emit(
                            "upload_progress",
                            {"progress": round(percent_progress, 2)},
                            room=socket_id,
                        )
                        pre_percent_progress = percent_progress
        else:
            file.save(file_path)

        write_message_mode_w(
            f"Upload just now! File: {safe_filename}", ip=get_client_ip()
        )

    socketio.emit("upload_progress", {"progress": 100})

    return jsonify({"success": True}), 200


@app.route("/download/<filename>")
def download_file(filename):
    file_path = os.path.join(STORAGE_FOLDER, filename)
    if not os.path.exists(file_path):
        return "File not found", 404

    def generate():
        with open(file_path, "rb") as file:
            while chunk := file.read(4096):  # Đọc tệp từng khối 4KB
                yield chunk

    # Trả về tệp dưới dạng luồng dữ liệu
    write_message_mode_w(f"Just download! File: {filename}")
    return Response(
        generate(),
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/octet-stream",
        },
    )


@app.route("/images/<filename>")
def serve_image(filename):
    file_path = os.path.join(STORAGE_FOLDER, filename)
    if not os.path.exists(file_path):
        return "Image not found", 404

    return Response(
        open(file_path, "rb").read(),
        headers={"Content-Type": "image/jpeg"},  # Adjust MIME type if needed
    )


class ChatMessage:
    def __init__(self, sender_id, content, img_url):
        self.sender_id = sender_id  # Người gửi tin nhắn
        self.content = (
            content  # Nội dung tin nhắn (chỉ có nội dung nếu img url là None)
        )
        self.timestamp = datetime.now()  # Thời gian gửi tin nhắn
        self.img_url = img_url  # Đường dẫn tới ảnh (nếu có)

    def to_dict(self):
        return {
            "sender_id": self.sender_id,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "img_url": self.img_url,
        }


class ConnectedSocketClient:
    def __init__(self, socket_id, user_id):
        self.socket_id = socket_id
        self.user_id = user_id

    def to_dict(self):
        return {
            "socket_id": self.socket_id,
            "user_id": self.user_id,
        }


# Namespace cho "chat"
class ChatNamespace(Namespace):
    def on_connect(self):
        # Đưa socket mới vào danh sách kết nối
        socket_id = request.sid
        exists = False
        if socket_id:
            for client in chat_clients:
                if client.socket_id == socket_id:
                    exists = True
        if not exists:
            user_id = request.args.get("user_id")  # Lấy user_id từ auth
            chat_clients.append(ConnectedSocketClient(socket_id, user_id))
        # Gửi tất cả tin nhắn đã lưu tới client khi họ kết nối
        emit("load_messages", [message.to_dict() for message in chat_messages])
        emit("clients_update", {"total_clients": len(chat_clients)}, broadcast=True)

    def on_disconnect(self):
        socket_id = request.sid
        if socket_id:
            for client in chat_clients:
                if client.socket_id == socket_id:
                    chat_clients.remove(client)
        emit("clients_update", {"total_clients": len(chat_clients)}, broadcast=True)

    def on_send_message(self, data):
        # Lưu tin nhắn mới
        sender_id = data.get("sender_id", None)
        content = data.get("content", None)
        media = data.get("media", None)  # ArrayBuffer
        file_url = None
        if media:
            file_content = media.get("file_content", None)
            if file_content:
                filename = media.get("file_name", "Unknown")
                # Lưu file vào thư mục uploads
                safe_filename = secure_filename(filename)
                file_path = os.path.join(STORAGE_FOLDER, safe_filename)
                with open(file_path, "wb") as f:
                    f.write(file_content)
                file_url = f"/images/{safe_filename}"
        new_message = ChatMessage(sender_id, content, file_url)
        chat_messages.append(new_message)
        # Gửi tin nhắn mới tới tất cả client
        send(new_message.to_dict(), broadcast=True)


socketio.on_namespace(ChatNamespace("/chatting"))


# Xử lý lỗi 404
@app.errorhandler(404)
def not_found_error(error):
    return render_template(NOT_FOUND_PAGE), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
