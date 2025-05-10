# Preface

This file decsribes development enviroment and usage of available features.

## Development Environment

This server was developed using:

- **Operating System**: Windows 11
- **Python Version**: 3.12
- **IDE**: Cursor AI (for intelligent code assistance and development)
- **Version Control**: Git
- **Web Browser**: Chrome (for testing)
- **Testing method**: Manual testing

## Technical Notes

- The server uses Flask for the web framework
- WebSocket communication is handled by Flask-SocketIO
- File operations use secure methods from Werkzeug
- Real-time updates are managed through Socket.IO
- The UI is built with modern CSS features and responsive design
- Server write logs for monitoring and debugging

## Server Features

1. File Upload:

- Monitor the progress bar for large file uploads
- Check the status message for upload confirmation

2. Chat Usage:

- Keep the chat box at a comfortable height
- Use the file sharing feature for quick file distribution
- Monitor the user count for active participants

## Personal Notes
- Zip file contains all files and folders of the server (all src of the server compressed in the zip file)
- Turn off the firewall if clients cannot access the server via IPv4
- All messages of the chatting feature will disapear when the server is turned off