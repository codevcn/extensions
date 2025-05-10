from datetime import datetime
from configs import LOGGING_FILE_PATH
from flask import request


def clear_actions_log():
    try:
        with open(LOGGING_FILE_PATH, "w", encoding="utf-8") as file:
            file.write("")
    except PermissionError:
        print(">>> You have no right to access this file!")


# Mở (hoặc tạo mới nếu không tồn tại) file và ghi dữ liệu vào
def write_message_mode_w(msg, file=None, ip=None):
    current_time = datetime.now()
    formatted_time = current_time.strftime("%d/%m/%Y %H:%M:%S")
    formatted_content = f"""
        - Time: {formatted_time}, IP: {'Unknown' if ip is None else ip}, Message: "{msg}".
    """
    final_content = formatted_content.strip() + "\n"
    if file:
        file.write(final_content)
    else:
        try:
            with open(LOGGING_FILE_PATH, "a", encoding="utf-8") as file:
                file.write(final_content)
        except PermissionError:
            print(">>> You have no right to access this file!")


def get_client_ip():
    # Lấy IP từ header X-Forwarded-For nếu có (khi dùng proxy)
    ipList = request.headers.getlist("X-Forwarded-For")
    if ipList:
        return ipList[0]
    # Lấy IP trực tiếp từ request
    return request.remote_addr
