# WebGenesis — AI SaaS Application

WebGenesis is an AI-powered SaaS platform designed to generate, preview, and iterate on production-grade Next.js web applications directly in real-time cloud sandboxes. From natural language prompts to live interactive apps, WebGenesis streamlines the entire full-stack prototyping and development lifecycle.

---

## Features

- **Prompt-to-App Generation**: Create full, responsive Next.js App Router applications with modern UI/UX from plain English prompts.
- **Live Interactive Sandbox**: Instant browser preview powered by E2B cloud containers running a live Next.js development server.
- **Iterative Refinement**: Chat-based modifications with incremental code updates preserving context.
- **Design Variations**: One-click regeneration with alternative color palettes, layout alignments, and typography hierarchy.
- **Multi-Model AI Routing**: Primary high-speed generation via Groq (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) with automatic fallbacks to OpenRouter, Gemini, and OpenAI.
- **Robust Code Sanitization**: Built-in multi-pass unescaping and JSX balancing engine ensuring valid syntax across Turbopack builds.
- **Asynchronous Agent Orchestration**: Background execution pipeline powered by Inngest.
- **Modern UI & Dark Mode**: Sleek SaaS interface with Tailwind CSS and Radix UI components.

---

## Screenshots

### Homepage
![Homepage](./images/homepage.jpeg)
*WebGenesis landing page and prompt builder*

### Live Preview Output
![Output](./images/output)
*Interactive application preview with side-by-side code inspection*

### Workflow Architecture
![Working Flowchart](./images/working_flowchart.png)
*Execution flowchart across Next.js, Inngest agents, LLM providers, and E2B sandboxes*

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) / Radix UI, Lucide Icons
- **Sandboxed Execution**: [E2B Code Interpreter](https://e2b.dev/) Cloud Sandbox
- **AI Providers**: [Groq SDK](https://groq.com/) (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`), Google Gemini, OpenAI, OpenRouter
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **API Layer**: [tRPC v11](https://trpc.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database & ORM**: PostgreSQL ([Neon Serverless](https://neon.tech/)) with [Prisma ORM](https://www.prisma.io/)

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database (or Neon account)
- Groq API Key
- E2B API Key
- Clerk account for authentication

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yashmishra11/WebGenesis-AI-SaaS-Application.git
   cd WebGenesis-AI-SaaS-Application/web-genesis
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development

   # Database (PostgreSQL / Neon)
   DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

   # Inngest Background Jobs
   INNGEST_EVENT_KEY=
   INNGEST_SIGNING_KEY=
   INNGEST_DEV=true

   # AI Providers
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=openai/gpt-oss-120b

   # E2B Sandbox Runtime
   E2B_API_KEY=e2b_...
   ```

4. **Initialize Database**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Start Inngest Dev Server** (in a separate terminal):
   ```bash
   npm run inngest
   ```

6. **Start Application Dev Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view WebGenesis.

---

## Team

- **Yash** — [@yashmishra11](https://github.com/yashmishra11)
- **Shan** — [@Mohdshan09](https://github.com/Mohdshan09)
- **Prajjval** — [@prajjval9579](https://github.com/prajjval9579)

---

## License

This project is licensed under the [MIT License](LICENSE).

⭐️ If you find WebGenesis useful, please consider giving it a star on GitHub!
[Live Demo](https://webgenesis09.vercel.app)
