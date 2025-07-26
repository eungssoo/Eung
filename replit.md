# English Dictionary App

## Overview

This is a Flask-based English dictionary web application that allows users to search for English word definitions with Korean translations and provides text-to-speech pronunciation functionality. The app features a clean, responsive interface with dark theme support and maintains a local search history for user convenience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: HTML5 with Bootstrap 5 for responsive UI
- **Styling**: Custom CSS with Bootstrap dark theme integration
- **JavaScript**: Vanilla JavaScript for client-side functionality
- **Icons**: Font Awesome for visual elements
- **Theme**: Dark theme implementation using Bootstrap's data-bs-theme

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Structure**: Simple monolithic architecture with main app module
- **Routing**: RESTful URL patterns for word searches and definitions
- **Template Engine**: Jinja2 (Flask's default templating engine)

### Data Storage
- **Local Storage**: Browser localStorage for search history (client-side only)
- **No Database**: Application doesn't use persistent server-side data storage
- **Session Management**: Flask sessions with configurable secret key

## Key Components

### Core Application (app.py)
- **Main Routes**:
  - `/` - Homepage with search form
  - `/search` - POST endpoint for word search with validation
  - `/word/<word>` - Word definition display page
- **Word Validation**: Basic alphabetic character validation
- **Error Handling**: Flash message system for user feedback

### Frontend Components
- **Search Interface**: Large, prominent search form with Bootstrap styling
- **Responsive Design**: Mobile-first approach using Bootstrap grid system
- **Search History**: Client-side storage and display of recent searches
- **Flash Messages**: Server-side message display system

### Text-to-Speech Integration
- **Library**: Google Text-to-Speech (gTTS) for pronunciation generation
- **Audio Delivery**: Temporary file generation and streaming to client
- **User Control**: Audio player controls for pronunciation playback

### Korean Translation Integration
- **Translation API**: Google Translate (googletrans library) for English-to-Korean translation
- **Real-time Translation**: Automatic Korean translations for word definitions and examples
- **Styling**: Custom CSS classes for Korean text with proper font families
- **User Experience**: Seamless bilingual dictionary experience

## Data Flow

1. **Word Search Flow**:
   - User enters word in search form → POST to `/search`
   - Server validates input → Redirects to `/word/<word>`
   - Word definition page loads → Calls Dictionary API
   - Results displayed with pronunciation option

2. **Pronunciation Flow**:
   - User requests pronunciation → gTTS generates audio file
   - Temporary file created → Served to client → File cleanup

3. **Search History Flow**:
   - Search performed → JavaScript adds to localStorage
   - History displayed on subsequent page loads
   - Maximum 10 recent searches maintained

## External Dependencies

### APIs
- **Dictionary API**: `https://api.dictionaryapi.dev/api/v2/entries/en/` for word definitions
- **Google Text-to-Speech**: gTTS library for pronunciation generation

### Frontend Libraries
- **Bootstrap 5**: CSS framework with dark theme
- **Font Awesome 6**: Icon library
- **Replit Bootstrap Theme**: Custom dark theme CSS

### Python Libraries
- **Flask**: Web framework
- **gTTS**: Google Text-to-Speech
- **requests**: HTTP client for API calls

## Deployment Strategy

### Environment Configuration
- **Development**: Uses default Flask development server
- **Session Secret**: Environment variable `SESSION_SECRET` with fallback
- **Logging**: Debug level logging enabled for development

### File Structure
- **Static Assets**: CSS and JavaScript served from `/static` directory
- **Templates**: HTML templates in `/templates` directory
- **Entry Point**: `main.py` imports and runs the Flask app

### Scalability Considerations
- **Stateless Design**: No server-side user data storage
- **API Rate Limits**: Dependent on external Dictionary API limits
- **Temporary Files**: gTTS audio files require cleanup management

The application follows a simple, educational-focused architecture prioritizing ease of use and clear code structure over complex enterprise patterns.