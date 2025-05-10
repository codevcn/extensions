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
