# Blog Content Generation System

## Overview

This is a full-stack TypeScript application that helps users generate SEO-optimized blog content through AI-powered analysis and content creation. The system uses multiple AI models (Gemini, Claude, Perplexity, OpenAI) to create high-quality, keyword-optimized blog posts with proper SEO metrics, citations, and infographic images. Users can copy text content separately and download individual infographics for their marketing needs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **API Design**: RESTful API with JSON responses

## Key Components

### AI Service Integration
- **Gemini 2.5 Pro**: Keyword analysis and content editing
- **Claude Sonnet 4**: Blog post generation and optimization
- **Perplexity Sonar Pro**: Research data collection and fact-checking
- **DALL-E 3**: Infographic generation for each subtitle/section

### Database Schema
- **users**: User authentication and management
- **blogProjects**: Main project entity with workflow status tracking
- **chatMessages**: Chat-based content editing system

### Project Workflow States
1. `keyword_analysis` - Initial keyword research and intent analysis
2. `data_collection` - Research data gathering from external sources
3. `business_info` - Business information collection for personalization
4. `content_generation` - AI-powered blog post creation
5. `completed` - Final content with SEO optimization complete

## Data Flow

1. **Project Creation**: User inputs keyword, system creates project with initial status
2. **Keyword Analysis**: Gemini analyzes search intent and suggests subtitles
3. **Research Phase**: Perplexity gathers relevant data and citations
4. **Business Integration**: User provides business information for personalization
5. **Content Generation**: Claude creates SEO-optimized blog post
6. **Image Generation**: DALL-E 3 creates infographics for each subtitle
7. **Optimization**: System analyzes SEO metrics and provides suggestions
8. **Content Export**: Users can copy text separately and download individual images
9. **Editing**: Chat-based interface allows iterative content refinement

## External Dependencies

### AI Services
- **Anthropic API**: Claude 4 for content generation
- **Google Gemini API**: Gemini 2.5 Pro for analysis and editing
- **Perplexity API**: Sonar Pro for research and fact-checking
- **OpenAI API**: DALL-E 3 for image generation

### Database & Infrastructure
- **Neon Database**: PostgreSQL hosting with serverless scaling
- **Drizzle Kit**: Database migrations and schema management

### Frontend Libraries
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **React Hook Form**: Form validation and handling

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend
- **tsx**: TypeScript execution for backend development
- **Concurrent Development**: Frontend and backend run simultaneously

### Production Build
- **Frontend**: Vite builds to `dist/public` with asset optimization
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema deployment

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **AI APIs**: Separate API keys for each service
- **Session Management**: PostgreSQL session store with connect-pg-simple

The application follows a modern TypeScript stack with strong typing throughout, efficient state management, and a clean separation between frontend and backend concerns. The AI integration is modular and extensible, allowing for easy addition of new AI services or modification of existing workflows.