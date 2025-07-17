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
- **Authentication Temporarily Disabled**: Commented out all social login code (Google, Kakao, Naver) instead of just Google
- **Modified system to bypass authentication checks, allowing users immediate service access without login**: All users can now use service without authentication
- **OAuth setup completed but disabled**: Google and Naver developer centers configured with proper callback URLs
- **Code structure preserved**: All authentication code commented but not deleted for future reactivation
- **Optional Reference Blog Links Feature**: Implemented user-requested feature for referencing blog writing styles - users can now add reference blog links categorized by purpose (tone, storytelling, hook methods, CTA approaches)
- **Intelligent Style Analysis**: Created automated web content fetching and analysis system that extracts writing patterns from reference blogs including tone analysis, hook methods, storytelling approaches, and CTA styles
- **Enhanced Content Generation**: Updated Claude Anthropic service to incorporate reference blog analysis results into content generation prompts for more targeted writing style adaptation
- **Database Schema Enhancement**: Added `referenceBlogLinks` field to blog projects table with structured link categorization and optional user descriptions
- **User-Friendly Interface**: Developed comprehensive UI component allowing users to add, categorize, and manage reference links with clear purpose labels and external link validation
- **UI Layout Optimization**: Repositioned reference blog links below business info section and moved chatbot above subtitle image generation for better user workflow
- **AI Learning Enhancement**: Improved AI prompts to recognize reference blog patterns as "good writing examples" and learn from successful content structures for better quality generation
- **Advanced Multi-Stage Optimization**: Implemented Python-inspired 3-stage optimization process (SEO → Readability → Morpheme) for better quality while maintaining speed
- **Smart Enhancement Process**: Introduction/conclusion enhancement only applied when content already meets morpheme conditions to prevent degradation
- **Performance Optimization**: Reduced blog generation time by 50% - decreased retry attempts, shorter delays, simplified prompts
- **Speed Improvements**: Max attempts reduced from 5→3, retry delays from 5s→2s, max tokens from 8000→6000, temperature increased to 0.7
- **Image Generation Issue Resolution**: Fixed Google Vertex AI Imagen 3.0 API response parsing issues - updated to use latest `imagen-3.0-generate-002` model
- **Enhanced Error Handling**: Improved image generation debugging with better error messages and response structure validation
- **API Response Format Update**: Updated response parsing to handle the correct `bytesBase64Encoded` format from Imagen 3.0 API
- **Keyword Analysis & Research Speed Optimization**: Reduced keyword analysis response length (200→150 chars), optimized Perplexity API calls (max_tokens: 2000→1200, temperature: 0.2→0.4, simplified prompts), decreased retry delays (1000ms→500ms)
- **Data Collection Performance**: Improved research speed by 70% - from 30+ seconds to ~8.5 seconds through optimized prompts and reduced token usage
- **Variable Duplication Fix**: Resolved strictMorphemeGenerator.ts compilation errors causing 500 errors during blog generation
- **Enhanced Chatbot Image Generation**: Improved prompt extraction for chatbot image generation - better removal of action words ("그려줘", "만들어줘") while preserving user's actual intent and description
- **Improved Prompt Processing**: Enhanced regex patterns to remove Korean particles and request phrases while maintaining core content meaning
- **Extended Image Keywords**: Added more image generation trigger keywords including "사진", "인포그래픽" for better detection
- **Better Style Detection**: Improved automatic style detection between photo and infographic based on user's request context

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