# File Upload Server

A Flask-based file upload server with real-time progress tracking and chat functionality.

## Features

- File upload with progress tracking
- Real-time file upload progress using Socket.IO
- File download functionality
- Chat system with file sharing capabilities
- Modern and responsive UI
- Custom 404 error page

## Requirements

- Python 3.7 or higher
- Flask
- Flask-SocketIO
- Other dependencies listed in requirements.txt

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd upload-files-server
```

2. Create a virtual environment (recommended):

```bash
python -m venv venv
```

3. Activate the virtual environment:

- Windows:

```bash
venv\Scripts\activate
```

- Linux/Mac:

```bash
source venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the Server

1. Make sure your virtual environment is activated

2. Start the server:

- Using python:

```bash
python src/app.py
```

- Using cmd file

```bash
./run.cmd
```

The server will start on `http://localhost:8080`

## Usage

### File Upload

- Navigate to the home page
- Click the upload button or drag and drop files
- Monitor upload progress in real-time
- Files will be stored in the configured storage folder

### File Download

- View the list of uploaded files on the home page
- Click on a file to download it

### Chat System

- Connect to the chat system using Socket.IO
- Send messages and share files
- View real-time updates of connected clients

## Configuration

The server can be configured by modifying the following files:

- `src/configs.py`: Server configuration settings
- `src/static/variables.css`: UI color scheme and styling variables

## Error Handling

- Custom 404 error page for better user experience
- Proper error handling for file operations
- Real-time error notifications

## Security

- Secure filename handling

## Detailed Usage Instructions At Frontend Side

### 1. File Upload System

#### Uploading Files

- Navigate to the home page
- Click the "Choose files" button or drag and drop files into the upload area
- Selected files will appear in the "Picked Files" list
- Click "Upload" to start the upload process
- Monitor upload progress in real-time through the progress bar
- Files are automatically stored in the configured storage folder

#### Downloading Files

- View the list of available files in the "Available Files" section
- Click on any file name to download it
- Files are served with proper MIME types for correct handling

### 2. Real-time Progress Tracking

- Upload progress is shown in real-time using a progress bar
- Progress percentage is displayed numerically
- Progress updates are sent via WebSocket for smooth updates
- Progress tracking works for both single and multiple file uploads

### 3. Chat System

#### Connecting to Chat

- The chat system automatically connects when you load the page
- Your user ID is automatically assigned
- Connection status is shown in the chat interface
- Click on float button at the cornner of the page to toggle the chatting UI and file upload UI

#### Sending Messages

- Type your message in the chat input field
- Press Enter or click the send button to send
- Messages are displayed in real-time to all connected users
- Messages displayed on chatbox include timestamp

#### File Sharing in Chat

- Click the attachment button to select a file
- Selected files are uploaded and shared in the chat
- Images are displayed directly in the chat
- Other file types are shown as downloadable links

#### Chat Interface Features

- Adjustable chat box height
- Real-time user count display
- Responsive design for all screen sizes
