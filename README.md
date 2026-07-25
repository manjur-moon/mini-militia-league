<div align="center">

Mini Militia League

A competitive league management and analytics platform for verified match tracking, player rankings, titles, achievements, and performance insights.

Live Website · Server API

</div>

Table of Contents

Overview

Project Links

Demo Credentials

User Roles

Core Features

Technology Stack

Frontend Architecture

Application Routes

Screenshots

Getting Started

Environment Variables

Available Scripts

Testing

Deployment

Related Repository

Author

Overview

Mini Militia League is a full-stack league management and analytics platform for recording verified matches, tracking player performance, and managing competitive rankings.

Visitors can explore players, matches, leaderboards, ratings, titles, achievements, rivalries, challenges, seasons, Hall of Fame records, MVP results, and league analytics.

Authenticated players can access a protected dashboard, review their linked player profile, track performance, view achievements and challenges, receive notifications, and manage account settings.

Moderators and administrators can upload match screenshots, review OCR-extracted results, correct match data, verify or reject matches, and manage league records.

This repository contains the React frontend of Mini Militia League. The interface is responsive across mobile, tablet, laptop, and desktop devices and includes protected role-based routes.

Project Links

Resource

URL

Live Website

https://mini-militia-league-client.vercel.app

Live API

https://mini-militia-league.onrender.com

Repository

https://github.com/manjur-moon/mini-militia-league.git

Demo Credentials

Role

Email

Password

Admin

YOUR_ADMIN_EMAIL

YOUR_ADMIN_PASSWORD

Player

YOUR_PLAYER_EMAIL

YOUR_PLAYER_PASSWORD

Demo credentials are intended only for project review. Replace or disable them before production use.

User Roles

Guest

Explores public players, matches, leaderboards, and analytics

Views ratings, titles, achievements, rivalries, challenges, seasons, and Hall of Fame records

Registers or logs in

Player

Accesses the protected player dashboard

Views the linked player profile and performance statistics

Tracks achievements and challenges

Views notifications and account settings

Moderator

Uploads match screenshots

Reviews OCR-extracted match results

Corrects player data and result values

Verifies or rejects submitted matches

Retries failed OCR jobs

Admin

Manages users and players

Manages ratings, titles, achievements, rivalries, challenges, seasons, and Hall of Fame records

Reviews match uploads and verification workflows

Accesses administrative analytics and notifications

Core Features

Email and password authentication with Better Auth

Protected routes with role-based access control

Responsive public and dashboard layouts

Public player directory and player profile pages

Verified match listing and match details

Match screenshot upload and OCR review workflow

Manual correction, verification, and rejection of match results

Global, weekly, monthly, and seasonal leaderboards

MVP results and player performance analytics

Player ratings and dynamic league titles

Achievement and challenge tracking

Rivalry and head-to-head performance views

Hall of Fame and season records

Search, filtering, sorting, and pagination

Loading states, empty states, toast feedback, and API error handling

Technology Stack

Core

Technology

Purpose

React

Component-based user interface

Vite

Development server and production build

JavaScript

Frontend application logic

Tailwind CSS

Responsive styling and dark mode

State, Data, and Authentication

Technology

Purpose

TanStack Query

Data fetching, caching, mutations, and invalidation

Axios

API communication

Better Auth Client

Authentication and session management

React Router

Public, protected, and role-based routing

UI and Visualization

Technology

Purpose

Recharts

League and player analytics charts

Lucide React

Interface icons

Sonner

Toast notifications

Cloudinary

Player photo and match screenshot storage through the server

Frontend Architecture

flowchart LR
Browser[Browser] --> Router[React Router]
Router --> Public[Public Pages]
Router --> Protected[Protected Dashboards]
Protected --> Auth[Better Auth Session]
Public --> Query[TanStack Query]
Protected --> Query
Query --> Client[Axios API Client]
Client --> Server[Mini Militia Express API]

Typical source structure:

src/
├── app/ # Router and application providers
├── components/ # Shared brand and UI components
├── config/ # Navigation configuration
├── features/ # Authentication and feature modules
├── layouts/ # Public and dashboard layouts
├── lib/ # API client, auth client, and utilities
├── pages/ # Public and protected pages
└── services/ # Feature-specific API services

Application Routes

Public Routes

Route

Description

/

Homepage

/players

Player directory

/players/:playerId

Player profile

/matches

Verified match listing

/matches/:matchId

Match details

/leaderboards

League leaderboards

/analytics

League analytics

/insights

AI league insights

/mvp

MVP results

/ratings

Player ratings

/titles

Dynamic league titles

/achievements

Achievements

/rivalries

Player rivalries

/challenges

League challenges

/hall-of-fame

Hall of Fame

/seasons

League seasons

/login

User login

/register

User registration

Player Dashboard

Route

Description

/player

Player dashboard overview

/player/profile

Linked player profile

/player/performance

Performance analytics

/player/achievements

Player achievements

/player/challenges

Player challenges

/player/notifications

Player notifications

/player/account

Account settings

Moderator Dashboard

Route

Description

/moderator

Moderator dashboard

/moderator/uploads

Upload match screenshots

/moderator/archive

Match archive

/moderator/verification

Match verification queue

/moderator/failed-jobs

Failed OCR jobs

Admin Dashboard

Route

Description

/admin

Admin dashboard overview

/admin/users

User management

/admin/players

Player management

/admin/analytics

Administrative analytics

/admin/ratings

Rating management

/admin/titles

Title management

/admin/achievements

Achievement management

/admin/rivalries

Rivalry management

/admin/challenges

Challenge management

/admin/hall-of-fame

Hall of Fame management

/admin/seasons

Season management

/admin/uploads

Upload match screenshots

/admin/matches

Match management

/admin/verification

Match verification queue

/admin/notifications

Notification management

Screenshots

Create a docs/screenshots folder and add project screenshots using the filenames below.

<!--
### Home Page
![Mini Militia League home page](docs/screenshots/home-page.png)

### Player Directory
![Mini Militia League player directory](docs/screenshots/players-page.png)

### Player Profile
![Mini Militia League player profile](docs/screenshots/player-profile.png)

### Leaderboards
![Mini Militia League leaderboards](docs/screenshots/leaderboards.png)

### Match Verification
![Mini Militia League match verification](docs/screenshots/match-verification.png)

### Admin Dashboard
![Mini Militia League admin dashboard](docs/screenshots/admin-dashboard.png)

### Mobile View
![Mini Militia League mobile view](docs/screenshots/mobile-view.png)
-->

Recommended screenshot size: 1440 × 900 for desktop and 390 × 844 for mobile.

Getting Started

Prerequisites

Node.js 20 or newer

npm

Running Mini Militia League server

1. Clone the repository

git clone https://github.com/manjur-moon/mini-militia-league.git
cd mini-militia-league

2. Install dependencies

npm install

3. Create the environment file

macOS/Linux:

cp client/.env.example client/.env

Windows PowerShell:

Copy-Item client/.env.example client/.env

4. Configure the environment variables

Update client/.env with the local or deployed backend URLs.

5. Start the development server

npm run dev

Open:

http://localhost:5173

Environment Variables

Create client/.env from client/.env.example:

VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_AUTH_BASE_URL=http://localhost:5000

Variable

Description

VITE_API_BASE_URL

Versioned Mini Militia League API URL

VITE_AUTH_BASE_URL

Better Auth server origin

Never place MongoDB credentials, Better Auth secrets, Cloudinary secrets, or other server-only credentials in the frontend environment.

Available Scripts

Command

Description

npm run dev

Start the development environment

npm run build

Create the production build

npm run lint

Run ESLint checks

npm run test

Run the automated test suite

npm run qa

Run linting, formatting, tests, build, and static QA

Testing

Run all quality checks:

npm run qa

Manual checks:

Register, log in, and log out

Open protected player, moderator, and admin routes

View players, matches, leaderboards, ratings, and analytics

Test search, filtering, sorting, and pagination

Upload and review a match screenshot

Verify role restrictions and dashboard navigation

Test mobile, laptop, and desktop layouts

Deployment

Vercel

Push the repository to GitHub.

Import the repository into Vercel.

Keep Vite as the framework preset.

Add the required environment variables.

Deploy the application.

Production environment:

VITE_API_BASE_URL=https://mini-militia-league.onrender.com/api/v1
VITE_AUTH_BASE_URL=https://mini-militia-league.onrender.com

After deployment, add the exact Vercel origin to the backend CORS and Better Auth trusted-origin configuration.

Related Repository

The backend source, API routes, database models, authentication, OCR processing, Cloudinary uploads, match verification, statistics, and deployment configuration are included in the same project repository.

Project Repository: https://github.com/manjur-moon/mini-militia-league.git

Author

Manjurul Islam Moon

GitHub: https://github.com/manjur-moon

LinkedIn: https://www.linkedin.com/in/md-manjurul-islam-616701295/

Email: mmanjurulislam@gmail.com

License

No open-source license has been specified.
