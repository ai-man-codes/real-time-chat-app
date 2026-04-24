# NexusChat

A modern, high-performance real-time chat application built with **Next.js 15**, **Socket.io**, and **Shadcn UI**.

![NexusChat Preview](https://via.placeholder.com/800x450?text=NexusChat+Interface)

## Features

- **Real-time Messaging**: Instant message delivery using WebSockets.
- **Online Presence**: View a list of currently active users in the sidebar.
- **Typing Indicators**: See when others are typing in real-time.
- **Join/Leave Notifications**: System alerts when users enter or exit the room.
- **Persistent History**: Chat history is saved locally so you don't lose context on refresh.
- **Clean Interface**: Minimalist, professional UI built with Shadcn UI and Lucide icons.
- **Responsive Design**: Works seamlessly on mobile and desktop.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Real-time**: [Socket.io](https://socket.io/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Runtime/Package Manager**: [Bun](https://bun.sh/) (or Node/npm)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd real-time-chat-app
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Run the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

The app will be available at [http://localhost:4000](http://localhost:4000).

## Docker Deployment

The project includes a production-ready Dockerfile.

1. Build the image:
   ```bash
   docker build -t chat-app .
   ```

2. Run the container:
   ```bash
   docker run -p 4000:4000 chat-app
   ```

## Architecture

- `server.js`: Custom Node.js server that handles both Next.js requests and Socket.io events.
- `src/contexts/ChatContext.tsx`: Core logic for socket management and state.
- `src/components/Chat.tsx`: Clean, component-based UI layout.
- `src/socket.js`: Client-side socket initialization.

## CI/CD

This project uses **GitHub Actions** for continuous integration. The pipeline automatically runs:
- Dependency installation
- Linting checks
- Production build
- Docker image build verification

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for details.

## License

This project is open-source and available under the [MIT License](LICENSE).
