<div align="center">

Mini Militia League

A production-oriented MERN league management and analytics platform for verified Mini Militia matches, OCR-assisted score extraction, player rankings, achievements, challenges, rivalries, seasons, Hall of Fame records, and role-based dashboards.

## Live Links

- **Live Website:** [Open Application](https://mini-militia-league-client.vercel.app)
- **Live API:** [Open API](https://mini-militia-league.onrender.com)
- **API Health Check:** [Check API Health](https://mini-militia-league.onrender.com/api/v1/health)
- **GitHub Repository:** [View Source Code](https://github.com/manjur-moon/mini-militia-league)
- **PaddleOCR Service:** [OCR Health Check](https://mini-militia-paddle-ocr.onrender.com/health)

</div>

Table of Contents

Overview

Key Features

User Roles

Technology Stack

System Architecture

Repository Structure

Prerequisites

Local Installation

Environment Variables

Running the Project

Health Checks

Database Preparation

Available Scripts

Testing and Quality Assurance

Production Build

Deployment

Troubleshooting

Security Notes

Author

License

Overview

Mini Militia League is a full-stack competitive league platform for recording screenshot-based match results, verifying extracted statistics, calculating official rankings, and presenting public and private analytics.

The application supports:

A responsive React frontend

An Express and MongoDB backend

Better Auth authentication and session management

Role-based access control for players, moderators, and administrators

Cloudinary image storage

Gemini OCR as the primary screenshot extraction provider

PaddleOCR as the fallback OCR provider

Manual result review and correction

Dense kill-based placements

Automated statistics, achievements, challenges, rivalries, seasons, MVP, and Hall of Fame processing

Dense Ranking Rule

Placements are calculated from kills in descending order.

Players with equal kills receive the same placement. Deaths do not break ties.

Kills:       21, 21, 18, 12
Placement:    1,  1,  2,  3

Key Features

Public Experience

Responsive home page

Player directory and player profiles

Verified match history

Global, weekly, monthly, and seasonal leaderboards

MVP results

League analytics

Player ratings and titles

Achievements and challenges

Rivalry and head-to-head records

Seasons and Hall of Fame

Search, filtering, sorting, and pagination

Authentication and Authorization

Email and password authentication with Better Auth

Cookie-based sessions

Protected routes

Role-based access control

Player, moderator, and administrator dashboards

Account and session management

Player Management

Unique player IDs

Player profile photos

Active and inactive status

User-to-player linking

Player statistics and analytics

Achievement, challenge, rivalry, and title tracking

Match Management

Match screenshot upload

Cloudinary screenshot storage

Duplicate screenshot protection

OCR job queue and retry workflow

Gemini primary OCR

PaddleOCR fallback

OCR sweep-line scanning animation

Player matching and manual correction

Kill-based dense placement calculation

Match verification and rejection

Admin-only deletion of rejected matches

Controlled corrections for verified matches

Versioned correction history

Analytics and Automation

Total matches

Total kills and deaths

KDR

Average kills and deaths

Win rate

Placement statistics

MVP tracking

Rankings

Achievement evaluation

Challenge evaluation

Rivalry recalculation

Season assignment

Hall of Fame refresh

AI-generated league insights when enabled

User Roles

Guest

Browse public pages

View players, verified matches, leaderboards, ratings, and analytics

Register or sign in

Player

Access the protected player dashboard

View the linked player profile

Track statistics, achievements, and challenges

View notifications

Manage account settings

Moderator

Upload match screenshots

Review OCR results

Correct extracted values

Verify or reject matches

Retry failed OCR jobs

Access the match archive and verification queue

Administrator

Access all moderator capabilities

Manage users and players

Manage ratings, titles, achievements, challenges, seasons, rivalries, and Hall of Fame records

Propose and approve verified-match corrections

Delete rejected matches

Access administrative analytics and notification management

Technology Stack

Frontend

React

Vite

JavaScript

Tailwind CSS

React Router

TanStack Query

Axios

Better Auth Client

React Hook Form

Zod

Recharts

Framer Motion

Lucide React

Sonner

Vitest

Testing Library

Backend

Node.js

Express

MongoDB

Mongoose

Better Auth

Zod

Cloudinary

Multer

Sharp

Helmet

CORS

Express Rate Limit

Morgan

Vitest

Supertest

OCR Service

Python

FastAPI

Uvicorn

PaddleOCR

PaddlePaddle

OpenCV

NumPy

Deployment

Vercel for the frontend

Render for the Node.js API

Render for the PaddleOCR service

MongoDB Atlas for the production database

Cloudinary for image storage

System Architecture

flowchart LR
    Browser[Browser] --> Client[React Client on Vercel]
    Client --> API[Express API on Render]
    API --> Auth[Better Auth]
    API --> MongoDB[(MongoDB Atlas)]
    API --> Cloudinary[Cloudinary]
    API --> Gemini[Gemini OCR]
    API --> Paddle[PaddleOCR FastAPI on Render]
    Gemini --> Review[Match Review Workflow]
    Paddle --> Review
    Review --> Verify[Verification and Dense Ranking]
    Verify --> Stats[Statistics and League Automation]

Repository Structure

mini-militia-league/
├── client/                     # React and Vite frontend
├── server/                     # Express and MongoDB backend
├── ocr-service/                # PaddleOCR fallback service
├── shared/                     # Shared workspace utilities and schemas
├── scripts/                    # QA and deployment scripts
├── docs/                       # OpenAPI and project documentation
├── render.yaml
├── vercel.json
├── package.json
└── README.md

Prerequisites

Install the following before starting:

Node.js 22.13.0 or newer

npm 10 or newer

Python matching ocr-service/.python-version

Git

MongoDB Atlas or a local MongoDB server

A Cloudinary account

A Gemini API key

A modern browser

Verify your versions:

node --version
npm --version
python --version
git --version

Local Installation

1. Clone the repository

git clone https://github.com/manjur-moon/mini-militia-league.git
cd mini-militia-league

2. Install Node.js dependencies

npm install

3. Create the frontend environment file

Windows PowerShell:

Copy-Item client/.env.example client/.env

macOS or Linux:

cp client/.env.example client/.env

4. Create the backend environment file

Windows PowerShell:

Copy-Item server/.env.example server/.env

macOS or Linux:

cp server/.env.example server/.env

5. Create the Python virtual environment

Windows PowerShell:

cd ocr-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ..

macOS or Linux:

cd ocr-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ..

Environment Variables

Never commit real secrets or production credentials.

Client Environment

Create client/.env:

VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_BASE_URL=http://localhost:5000

Server Environment

Create server/.env:

NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=mini_militia_league

CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:5000

BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters-long
BETTER_AUTH_COOKIE_PREFIX=mini_militia
AUTH_COOKIE_SAME_SITE=lax
AUTH_SESSION_EXPIRES_IN=604800
AUTH_SESSION_UPDATE_AGE=86400
AUTH_SESSION_FRESH_AGE=86400

TRUST_PROXY=false
LOG_LEVEL=info
JSON_BODY_LIMIT=1mb
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=300
LEAGUE_TIMEZONE=Asia/Dhaka

INITIAL_ADMIN_NAME=League Administrator
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=replace-with-a-strong-unique-password

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_PLAYER_FOLDER=mini-militia/players
CLOUDINARY_MATCH_FOLDER=mini-militia/matches

MATCH_SCREENSHOT_MAX_BYTES=10485760

OCR_PROVIDER=gemini
OCR_FALLBACK_PROVIDER=paddleocr
OCR_MAX_ATTEMPTS=3
OCR_LOW_CONFIDENCE_THRESHOLD=0.75
OCR_PARSER_PROFILE=mini-militia-final-score-v1
OCR_RESULT_COLUMN_ORDER=placement,name,kills,deaths

OCR_CROP_X_RATIO=0.205
OCR_CROP_Y_RATIO=0.30
OCR_CROP_WIDTH_RATIO=0.32
OCR_CROP_HEIGHT_RATIO=0.51
OCR_UPSCALE_WIDTH=1600

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-working-gemini-model
GEMINI_REQUEST_TIMEOUT_MS=45000

PADDLE_OCR_URL=http://127.0.0.1:8001
PADDLE_OCR_TIMEOUT_MS=90000

GOOGLE_VISION_API_KEY=
OCR_MOCK_TEXT=

AI_PROVIDER=disabled
OPENAI_API_KEY=
OPENAI_MODEL=
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_OUTPUT_TOKENS=1200

Generate a Better Auth secret:

node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

OCR Provider Examples

Gemini with PaddleOCR fallback:

OCR_PROVIDER=gemini
OCR_FALLBACK_PROVIDER=paddleocr
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-working-gemini-model
PADDLE_OCR_URL=http://127.0.0.1:8001

PaddleOCR only:

OCR_PROVIDER=paddleocr
OCR_FALLBACK_PROVIDER=disabled
PADDLE_OCR_URL=http://127.0.0.1:8001

PADDLE_OCR_URL must be the service base URL. Do not append /health or /ocr.

Running the Project

The frontend, backend, and OCR service run as three processes.

Terminal 1: PaddleOCR Service

Windows PowerShell:

cd C:\path\to\mini-militia-league\ocr-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8001

macOS or Linux:

cd /path/to/mini-militia-league/ocr-service
source .venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8001

Terminal 2: Backend Server

npm run dev:server

Backend URL:

http://localhost:5000

Terminal 3: Frontend Client

npm run dev:client

Frontend URL:

http://localhost:5173

Vite may use port 5174 when port 5173 is already occupied.

Start Client and Server Together

npm run dev

The PaddleOCR service must still run separately.

Health Checks

Backend:

Invoke-RestMethod http://localhost:5000/api/v1/health

curl http://localhost:5000/api/v1/health

PaddleOCR:

Invoke-RestMethod http://127.0.0.1:8001/health

curl http://127.0.0.1:8001/health

PaddleOCR API documentation:

http://127.0.0.1:8001/docs

Database Preparation

Create the Initial Administrator

Configure the initial administrator values in server/.env, then run:

npm run admin:bootstrap

Run Database Migrations and Seeds

npm run db:prepare

Fix the Dense Placement Index

Run this once for every existing database that still has a unique official-placement index:

node --env-file=server/.env server/scripts/fix-match-placement-index.js

Verify the indexes:

node --env-file=server/.env server/scripts/list-match-result-indexes.js

Expected placement index:

name: matchId_1_official.placement_1
unique: false

Available Scripts

Command

Description

npm run dev

Start the frontend and backend development servers

npm run dev:client

Start only the Vite frontend

npm run dev:server

Start only the Express backend

npm run build

Create the frontend production build

npm run start

Start the backend in production mode

npm run lint

Run ESLint

npm run format

Format supported files with Prettier

npm run format:check

Check Prettier formatting

npm run test

Run server and client tests

npm run test:server

Run backend tests

npm run test:client

Run frontend tests

npm run test:coverage

Run coverage for server and client

npm run test:critical

Run critical test suites

npm run test:database:memory

Run MongoDB memory integration tests

npm run check

Run lint, tests, and build

npm run qa

Run the complete QA pipeline

npm run admin:bootstrap

Create the initial administrator

npm run db:migrate

Run all database index migrations

npm run seed:defaults

Seed default production records

npm run db:prepare

Run migrations and default seeds

npm run deploy:preflight

Run backend production preflight validation

npm run deployment:validate

Validate deployment configuration

npm run verify:production

Run production verification checks

Testing and Quality Assurance

Run all tests:

npm run test

Run backend tests:

npm run test:server

Run frontend tests:

npm run test:client

Run linting:

npm run lint

Check formatting:

npm run format:check

Format the project:

npm run format

Run the complete QA pipeline:

npm run qa

The QA pipeline runs linting, formatting checks, tests, the production build, static quality checks, and deployment validation.

Recommended manual checks:

Register, sign in, and sign out

Verify player, moderator, and administrator route protection

Upload a new match screenshot

Confirm the OCR sweep-line animation appears while processing

Confirm Gemini extraction succeeds

Confirm PaddleOCR fallback works when Gemini fails

Review and correct OCR rows

Verify dense kill-based placements

Verify a match with tied kills

Reject a match

Delete a rejected match as an administrator

Confirm moderators cannot delete rejected matches

Test search, filtering, sorting, pagination, and responsive layouts

Production Build

Create the frontend build:

npm run build

Preview the built frontend:

npm --prefix client run preview

Start the backend in production mode:

npm run start

Deployment

Vercel Frontend

The repository includes vercel.json.

Recommended configuration:

Repository: manjur-moon/mini-militia-league
Production Branch: main
Project Root: repository root
Build Command: npm run build
Output Directory: client/dist
Install Command: npm ci

Vercel environment variables:

VITE_API_BASE_URL=https://mini-militia-league.onrender.com
VITE_AUTH_BASE_URL=https://mini-militia-league.onrender.com

Render Node.js Backend

Recommended configuration:

Runtime: Node
Build Command: npm ci --omit=dev
Start Command: npm run start -w server
Health Check Path: /api/v1/health

Important production environment variables:

NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
MONGODB_DB_NAME=mini_militia_league

CLIENT_ORIGINS=https://mini-militia-league-client.vercel.app
PUBLIC_APP_URL=https://mini-militia-league-client.vercel.app
PUBLIC_API_URL=https://mini-militia-league.onrender.com

BETTER_AUTH_URL=https://mini-militia-league.onrender.com
BETTER_AUTH_SECRET=your-production-secret
AUTH_COOKIE_SAME_SITE=none
TRUST_PROXY=true

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

OCR_PROVIDER=gemini
OCR_FALLBACK_PROVIDER=paddleocr
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-working-gemini-model
PADDLE_OCR_URL=https://mini-militia-paddle-ocr.onrender.com
PADDLE_OCR_TIMEOUT_MS=90000

Render PaddleOCR Service

Create a separate Python Web Service from the same repository.

Runtime: Python
Root Directory: ocr-service
Build Command: python -m pip install --upgrade pip && python -m pip install -r requirements.txt
Start Command: python -m uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health

The deployed service URL should be used as the backend value:

PADDLE_OCR_URL=https://mini-militia-paddle-ocr.onrender.com

Do not use http://127.0.0.1:8001 in the deployed backend.

Production Database Migration

Run the dense-placement migration once against the production database from a secure environment:

node --env-file=server/.env server/scripts/fix-match-placement-index.js
node --env-file=server/.env server/scripts/list-match-result-indexes.js

Troubleshooting

Backend Cannot Connect

Start the backend:

npm run dev:server

Check port 5000 on Windows:

Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

Missing Gemini API Key

GEMINI_API_KEY is required when Gemini is configured as an OCR provider.

Add the key to the backend environment and restart or redeploy the backend.

Uvicorn Command Not Found

cd ocr-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001

PaddleOCR Root URL Returns 404

Use /health, /docs, or /ocr.

Duplicate Placement Error

node --env-file=server/.env server/scripts/fix-match-placement-index.js

Vercel Cannot Resolve Framer Motion

npm install framer-motion --workspace=client
npm run build

Commit client/package.json and package-lock.json.

Cross-Origin Login Problems

Use consistent local URLs and restart both applications after changing environment variables:

VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_BASE_URL=http://localhost:5000
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174
BETTER_AUTH_URL=http://localhost:5000
AUTH_COOKIE_SAME_SITE=lax

Prettier Scans Generated Files

Ensure .prettierignore excludes dependencies, virtual environments, build output, caches, and coverage directories.

Security Notes

Never commit .env files

Never expose API keys or database credentials

Never store server secrets in VITE_ variables

Use different secrets for development and production

Rotate any secret that was shared publicly

Use strong administrator passwords

Disable or replace demo credentials before production use

Keep production CORS origins exact

Use HTTPS in production

Use AUTH_COOKIE_SAME_SITE=none only with HTTPS

Back up production data before destructive migrations

Author

Manjurul Islam Moon

GitHub: manjur-moon

LinkedIn: Md. Manjurul Islam

Email: mmanjurulislam@gmail.com

License

No open-source license has been specified.
