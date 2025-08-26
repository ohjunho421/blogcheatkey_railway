# Blog Content Generation System

## Overview
This is a full-stack TypeScript application for generating SEO-optimized blog content using multiple AI models (Gemini, Claude, Perplexity, OpenAI). It aims to produce high-quality, keyword-optimized blog posts with proper SEO metrics, citations, and infographic images. Users can copy text content and download individual infographics. The project's vision is to leverage AI for efficient and effective content creation, addressing market needs for scalable and high-quality digital marketing assets.

## Recent Changes (August 26, 2025)
- **CONFIGURATION RESTORATION**: Reverted to project 4f383ee4-7941-4ffe-922b-53f88ff5c307 settings
- **Morpheme Frequency**: Restored original 15-17 occurrences per component
- **Complete Keyword**: Restored original 5-7 occurrences for complete keyword  
- **Mobile Copy**: Restored Korean-aware 21-character line break formatting
- **SEO Guidelines**: Restored proven keyword optimization targets
- **Enhanced Error Handling**: Maintained deployment version a43e2530 single-attempt success logic

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM, utilizing Neon Database
- **API Design**: RESTful API with JSON responses

### Core Architectural Decisions
- **AI Service Integration**: Uses multiple AI models (Gemini 2.5 Pro, Claude Sonnet 4 / Opus 4.0, Perplexity Sonar Pro, Imagen 3.0) for distinct tasks like keyword analysis, content generation, research, and image creation.
- **Project Workflow**: Structured through defined states (`keyword_analysis`, `data_collection`, `business_info`, `content_generation`, `completed`) for clear progress tracking.
- **SEO Optimization**: Integrates a strict morpheme generation system ensuring keyword frequency (15-17 counts per component, 5+ for full keywords), character count (1500-1700), and keyword dominance. Includes intelligent morpheme overuse resolution.
- **Content Quality**: Focuses on natural blog tone, engaging introductions (35-40% of content, empathy or warning types), professional conclusions, and natural integration of business expertise and research citations.
- **UI/UX**: Features include drag-and-drop subtitle reordering, interactive AI image generation buttons, chat-based content editing with SEO validation, and a mobile-first responsive design with enhanced line breaking for readability.
- **Authentication**: Full authentication system enabled with session management and user permissions.
- **Error Handling**: Enhanced Perplexity API timeout handling (90s timeout, 3 retries with exponential backoff) for stable research data collection.
- **Deployment**: Utilizes Vite for frontend builds, esbuild for backend bundling, and Drizzle for database migrations.

## External Dependencies

### AI Services
- **Anthropic API**: Claude (Sonnet 4 and Opus 4.0) for blog post and title generation, content optimization.
- **Google Gemini API**: Gemini 2.5 Pro for keyword analysis, content editing, introduction/conclusion enhancement.
- **Perplexity API**: Sonar Pro for research data collection and fact-checking, with strict source filtering (excluding social media and specific Kakao domains).
- **Google Vertex AI**: Imagen 3.0 for infographic and general image generation.

### Database & Infrastructure
- **PostgreSQL Database**: Persistent storage for user, business, project, and chat message data.
- **Drizzle ORM**: Type-safe database operations with `@neondatabase/serverless` driver.
- **Drizzle Kit**: Database migrations and schema management.

### Frontend Libraries
- **TanStack Query**: Server state management and caching.
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first styling framework.
- **React Hook Form**: Form validation and handling.
- **Wouter**: Lightweight client-side routing.
- **@hello-pangea/dnd**: For drag-and-drop functionality.