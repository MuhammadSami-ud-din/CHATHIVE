# ChatHive Backend

REST API and real-time server for **ChatHive**, a chat app with servers, channels, direct messages, and 1-on-1 video calling.

**Live app:** https://chathive-chat.vercel.app
**Frontend repo:** https://github.com/MuhammadSami-ud-din/chathive-frontend

## Features

- JWT authentication for both REST routes and Socket.io connections
- Room-based real-time messaging (channels and DMs)
- Servers, channels, and invite-link joining
- Online presence and typing indicators
- WebRTC signaling for 1-on-1 video/voice calls
- Profile picture uploads
- Redis caching for frequently read routes (e.g. servers list)

## Tech Stack

- **Node.js** + **Express**
- **Socket.io** for real-time events
- **MySQL** for relational data (users, servers, channels, memberships)
- **MongoDB Atlas** for messages
- **Redis (Upstash)** for caching
- **JWT** for auth
- Deployed on **Render**

## Architecture

```
Client (React)
   │  REST + WebSocket
   ▼
Express + Socket.io
   ├── MySQL   → users, servers, channels, memberships
   ├── MongoDB → messages
   └── Redis   → cached reads
```

Messages are stored in MongoDB and identified by `_id`. The client uses that ID to deduplicate messages that arrive via both the API and the socket.

## Getting Started

```bash
git clone https://github.com/MuhammadSami-ud-din/CHATHIVE.git
cd chathive-backend
npm install
npm run dev
```

The server starts on `http://localhost:5000` by default. You'll need MySQL, MongoDB, and Redis available to run it locally.

## Socket Events

| Event | Purpose |
|---|---|
| `join_room` | Join a channel or DM room |
| `send_message` | Send a message to a room |
| `receive_message` | Broadcast a new message to the room |
| `typing` | Typing indicator |
| `user_online` / `user_offline` | Presence updates |
| `call_offer` / `call_answer` / `ice_candidate` | WebRTC signaling |

> Adjust these names to match your actual event names.

## Deployment

Hosted on Render. The MySQL database is hosted separately from the app server.

## Author

**Muhammad Sami ud Din**, [GitHub](https://github.com/MuhammadSami-ud-din)
