# AWS Certified Cloud Practitioner (CLF-C02) Exam Simulator

An interactive, offline-first exam simulation and study platform designed for the **AWS Certified Cloud Practitioner (CLF-C02)** examination. Features a warm cream paper sketchbook aesthetic with **550 exam-accurate scenario questions** weighted strictly according to the official AWS exam guide.

---

##  Features

- ** Realistic Exam Simulation**:
  - 65 questions randomly allocated according to official domain percentages.
  - 90-minute countdown timer with pause/resume support.
  - Flagging system, question navigator, and compensatory scaled scoring (100–1000 scale, 700 pass mark).
  - Comprehensive review upon submission with per-domain performance breakdown.

- ** Practice Mode**:
  - Immediate feedback after every answer.
  - Granular filters: filter by domain, unanswered questions, previously missed questions, or bookmarked items.
  - Comprehensive explanations for **every option** (why the correct answer is right and why distractors are wrong).
  - Direct links to official AWS documentation for every question.

- ** Mistake Bank**:
  - Automatically captures questions answered incorrectly.
  - Lets you drill down into recurring mistakes until concepts stick.

- ** Search & Browse**:
  - Full-text search and tag filtering across all 550 questions, services, and task statements.

- ** Flexible Storage & Sync**:
  - **Guest Mode (Default)**: 100% functional with zero registration required. All progress, bookmarks, and attempts are stored in your browser's local storage.
  - **Optional Account Sync**: Create an account to securely save and synchronize your history, bookmarks, and mistake bank across devices via a self-hosted PostgreSQL database.

---

## 📊 Question Bank & Domain Weighting

The question bank contains **550 original scenario questions** calibrated to match the official CLF-C02 blueprint:

| Domain | Exam Weight | Total Questions | Coverage Areas |
| :--- | :---: | :---: | :--- |
| **Domain 1: Cloud Concepts** | 24% | **132** | Cloud benefits, Well-Architected Framework pillars, AWS CAF, 7 Rs migration strategies, Cloud economics |
| **Domain 2: Security & Compliance** | 30% | **165** | Shared responsibility model, IAM, Least privilege, Secrets Manager, KMS, Shield, WAF, GuardDuty, Inspector, Compliance |
| **Domain 3: Cloud Technology & Services** | 34% | **187** | Global infrastructure, EC2, Lambda, Fargate, ECS/EKS, S3, EBS, EFS, RDS, Aurora, DynamoDB, VPC, Route 53, AI/ML |
| **Domain 4: Billing, Pricing, & Support** | 12% | **66** | Pricing models, Savings Plans, AWS Budgets, Cost Explorer, CUR, Support tiers, Trusted Advisor, Marketplace |
| **Total** | **100%** | **550** | **19 Task Statements fully covered** |

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend API**: [Node.js](https://nodejs.org/) (ES Modules), [Express](https://expressjs.com/), [PostgreSQL 16](https://www.postgresql.org/)
- **Reverse Proxy**: [Nginx](https://nginx.org/)
- **Orchestration**: [Docker Compose](https://docs.docker.com/compose/)

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- npm or pnpm
- (Optional) PostgreSQL 16 for backend account sync

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Run Locally

```bash
# Start backend API (runs on port 3001)
npm start --prefix backend

# Start Vite frontend dev server (in a separate terminal)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Homelab / Docker Deployment

Deploy the entire stack (PostgreSQL, Backend API, Frontend, and Nginx reverse proxy) in a single command using Docker Compose:

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` to configure your passwords:
```ini
POSTGRES_DB=ccp
POSTGRES_USER=ccp
POSTGRES_PASSWORD=your_strong_password
SESSION_SECRET=your_32_char_random_secret
HOST_PORT=8080
COOKIE_SECURE=false # Set to true if accessing over HTTPS
```

### 2. Launch Containers

```bash
docker compose up -d --build
```

Access the app at `http://<your-server-ip>:8080`.

---

## 📋 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Type-check and build production bundle |
| `npm run validate` | Validate all 550 questions against Zod schema and blueprint constraints |
| `npm run stats` | Display detailed breakdown of question bank statistics |
| `npm run lint` | Run oxlint linter across codebase |

---

## ⚖️ Disclaimer

This is an independent, unofficial study tool with original scenario-based practice questions. It is not affiliated with, authorized, maintained, or endorsed by Amazon Web Services (AWS) or Amazon.com, Inc.
