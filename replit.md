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
- **Gemini 2.5 Pro**: Keyword analysis, content editing, and introduction/conclusion enhancement
- **Claude Sonnet 4**: Blog post generation and optimization
- **Perplexity Sonar Pro**: Research data collection and fact-checking
- **Imagen 3.0**: Infographic generation for each subtitle/section

### Database Schema
- **users**: User authentication and management
- **userBusinessInfo**: User-specific business information storage (reusable across projects)
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
6. **Image Generation**: Imagen 3.0 creates infographics for each subtitle
7. **Optimization**: System analyzes SEO metrics and provides suggestions
8. **Content Export**: Users can copy text separately and download individual images
9. **Editing**: Chat-based interface allows iterative content refinement

## External Dependencies

### AI Services
- **Anthropic API**: Claude 4 for content generation
- **Google Gemini API**: Gemini 2.5 Pro for analysis and editing
- **Perplexity API**: Sonar Pro for research and fact-checking
- **Google Vertex AI**: Imagen 3.0 for image generation

### Database & Infrastructure
- **PostgreSQL Database**: Local PostgreSQL instance for persistent storage
- **Drizzle ORM**: Type-safe database operations with @neondatabase/serverless driver
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

## Recent Changes

### January 17, 2025
- **Image Generation Issue Resolution**: Fixed Google Vertex AI Imagen 3.0 API response parsing issues - updated to use latest `imagen-3.0-generate-002` model
- **Enhanced Error Handling**: Improved image generation debugging with better error messages and response structure validation
- **API Response Format Update**: Updated response parsing to handle the correct `bytesBase64Encoded` format from Imagen 3.0 API

### January 16, 2025
- **Interactive AI Image Generation**: Implemented hover-triggered image generation buttons on each subtitle section - users can generate infographics or photos directly from content sections with visual feedback
- **Chatbot Image Generation**: Added AI image generation to editing chat - users can request images with commands like "BMW 그림을 그려줘"
- **Google Vertex AI Integration**: Successfully integrated Imagen 3.0 for high-quality image generation with proper authentication and error handling
- **Enhanced API Error Handling**: Added retry logic and fallback responses for both Gemini and Claude API overload situations (status 503/529), ensuring content generation always succeeds with intelligent fallback content
- **Engaging Introduction & Conclusion Enhancement**: Enhanced intro to address reader pain points and build empathy, strengthened conclusion with compelling CTA that acknowledges time constraints and drives immediate action to contact business
- **Natural Blog Tone Implementation**: Changed to natural blog writing style using ~합니다, ~때문이죠, ~입니다, ~신가요? expressions for more engaging and relatable content
- **Professional-Friendly Tone Balance**: Balanced professional expertise with friendly approach - introductions establish credibility and create curiosity, conclusions guide readers to business contact for complex issues
- **Enhanced Mobile Formatting**: Improved mobile line break algorithm with cleaner 25-28 character segments, better Korean phrase boundary detection, and optimized readability
- **Strict Morpheme Generation System**: Created new strict morpheme generator that ensures all 3 conditions are met: 15-17 morpheme count, 1700-1800 characters, keyword morpheme dominance
- **Non-Conversational Content Generation**: Modified Claude and Gemini prompts to eliminate all conversational expressions and produce pure informational blog posts ready for copy-paste
- **Enhanced Morpheme Optimization**: Each keyword morpheme (BMW, 코딩) now requires 15-17 individual occurrences, not combined total
- **Keyword Frequency Dominance**: Keyword morphemes must be the most frequent words in content - no other morpheme can exceed keyword counts
- **Text Format Output**: Changed from markdown to plain text with optimized line breaks for better readability
- **Improved Analysis**: Individual morpheme counting with specific suggestions for over/under-occurrence
- **Manual Research Control**: Changed Perplexity data collection to manual operation - users can modify subtitles before triggering research
- **Gemini Enhancement Integration**: Added Gemini-powered introduction and conclusion enhancement after Claude generates initial content
- **Progress Visibility**: Project progress stepper visible from the start, not just after project creation
- **Text Formatting**: Subtitles followed by 2 line breaks, paragraphs by 1 line break for optimal readability
- **Mobile Optimization**: Enhanced mobile formatting with 30-character line breaks for better mobile reading
- **In-paragraph Line Breaks**: Added 40-50 character line breaks within paragraphs for improved readability
- **Responsive UI**: Mobile-first design with responsive buttons and improved text display
- **AI Status Indicators**: Fixed real-time AI model status display during keyword analysis and data collection
- **Enhanced Reference Links**: Added meaningful titles to citation links instead of raw URLs
- **Improved Content Tone**: Updated Claude prompts for more engaging, empathetic introduction and conclusion writing
- **Mobile Preview Feature**: Added preview functionality to show how mobile formatting will look before copying
- **Advanced Morpheme Analysis**: Improved morpheme analyzer to detect over-frequent non-keyword terms and ensure keyword dominance
- **Mobile Line Break Enhancement**: Improved mobile formatting to respect 30-character limit while maintaining readability
- **Content Regeneration Feature**: Added "다시 생성" button for users unsatisfied with generated content
- **Strict Keyword Limits**: Enhanced Claude prompts with absolute 20-count limit warnings and automatic retry logic for overuse detection
- **Blog Structure Enforcement**: Added clear instructions to Claude to generate informational blog posts, not conversational content
- **Morpheme Optimization System**: Created intelligent morpheme optimizer that removes or replaces keyword-heavy sentences when overuse is detected
- **Content Structure Restoration**: Added system to restore proper blog structure (intro-body-conclusion) after optimization

### January 15, 2025
- **Enhanced Business Info Management**: Added user-specific business information storage with `userBusinessInfo` table
- **Improved Industry Selection**: Upgraded business type selector to combobox with 50+ predefined options and custom input capability
- **Persistent User Profiles**: Business information now saves to user profile and auto-loads for future projects
- **Business Info Auto-Fill**: Added dropdown selection for saved businesses - selecting a business name automatically fills expertise and differentiators
- **Smart UI Flow**: Business info form now remains visible during content generation with clear progress indicators
- **Robust Error Handling**: Added fallback SEO analysis when Gemini API is overloaded, ensuring Claude-generated content is always delivered
- **Korean Morpheme Analysis**: Replaced Gemini API with custom Korean morpheme analyzer for reliable keyword counting
- **Business Info UX**: Form starts empty, saved business selection changes button to "블로그 생성"
- **Content Generation Speed**: Optimized Claude prompts and increased max_tokens to 8000 for faster generation
- **Model Updates**: Updated Perplexity API to use simplified `sonar-pro` model name
- **UI Improvements**: Fixed business info form UI with proper button placement and persistent form visibility

The application follows a modern TypeScript stack with strong typing throughout, efficient state management, and a clean separation between frontend and backend concerns. The AI integration is modular and extensible, allowing for easy addition of new AI services or modification of existing workflows.