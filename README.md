#  YouTube Manager (YTM)

A powerful, modern desktop application for YouTube creators to manage their channels, videos, analytics, and content workflow efficiently.

![YouTube Manager](https://img.shields.io/badge/YouTube-Manager-red?style=for-the-badge&logo=youtube)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

##  Features

###  Video Management
- Upload Videos: Single and bulk upload with drag-and-drop support
- Video Library: Comprehensive video manager with search and filtering
- Bulk Operations: Edit multiple videos simultaneously
- Scheduling: Schedule video releases with incremental timing

###  Analytics Dashboard
- Real-time Analytics: Track views, subscribers, and engagement
- Performance Metrics: Detailed insights into video performance
- Growth Tracking: Monitor channel growth over time

###  Comment Management
- Unified Inbox: Manage comments across all videos
- Moderation Tools: Approve, reply, or remove comments
- Bulk Actions: Handle multiple comments efficiently

###  Content Calendar
- Publishing Schedule: Plan and schedule content releases
- Content Pipeline: Track video production stages
- Deadline Management: Never miss upload deadlines

###  Advanced Settings
- Theme Customization: Light, dark, and system themes
- Upload Defaults: Set default privacy, tags, and categories
- Notification Preferences: Customize alerts and notifications
- Data Import/Export: Backup and restore settings

###  Global Search
- Universal Search: Find videos, comments, analytics, and settings
- Smart Filtering: Advanced search with multiple criteria
- Quick Navigation: Jump to any content instantly

##  Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- YouTube Data API v3 credentials

### Installation

1. Clone the repository
   `ash
   git clone https://github.com/nguyent0810/YTM.git
   cd YTM
   `

2. Install dependencies
   `ash
   npm install
   `

3. Set up YouTube API credentials
   - Go to Google Cloud Console
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials

4. Start the application
   `ash
   npm run start
   `

##  Web Deployment (Vercel)

### Deploy to Vercel

1. Build for web
   `ash
   npm run build
   `

2. Deploy with Vercel CLI
   `ash
   npm i -g vercel
   vercel --prod
   `

3. Or deploy via GitHub
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically build and deploy

### Environment Variables for Vercel

Set these in your Vercel dashboard:
- VITE_YOUTUBE_CLIENT_ID
- VITE_YOUTUBE_CLIENT_SECRET  
- VITE_YOUTUBE_REDIRECT_URI

##  Development

### Available Scripts
- npm run dev - Start development server
- npm run build - Build for production
- npm run start - Build and start Electron app
- npm run electron - Start Electron (requires built files)

##  License

This project is licensed under the MIT License.

---

Made with  for YouTube Creators
