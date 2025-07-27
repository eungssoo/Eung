# English Dictionary App

## Overview

This is a Flask-based English dictionary web application that allows users to search for English word definitions with Korean translations and provides text-to-speech pronunciation functionality. The app features a clean, responsive interface with dark/light theme support and focuses on simplicity without database dependencies.

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
- **No Database**: Simplified architecture without persistent storage
- **Session Management**: Flask sessions with configurable secret key for flash messages

## Key Components

### Core Application (app.py)
- **Main Routes**:
  - `/` - Homepage with search form
  - `/search` - POST endpoint for word search with validation
  - `/word/<word>` - Word definition display page
  - `/pronounce/<word>` - Audio pronunciation generation (normal speed)
  - `/pronounce/<word>/<speed>` - Audio pronunciation with speed control (normal/slow)
- **Word Validation**: Basic alphabetic character validation
- **Error Handling**: Flash message system for user feedback
- **Speed Support**: gTTS slow speech parameter integration

### Frontend Components
- **Search Interface**: Large, prominent search form with Bootstrap styling and keyboard shortcuts
- **Responsive Design**: Mobile-first approach using Bootstrap grid system
- **Flash Messages**: Server-side message display system
- **Theme Toggle**: Dark/light mode switcher with localStorage persistence
- **Navigation**: Simple home navigation with enhanced controls
- **Random Word**: Instant random vocabulary word selection
- **Keyboard Shortcuts**: Enter to search, Escape to clear input field
- **Speed Control**: Toggle between normal and slow pronunciation modes

### Text-to-Speech Integration
- **Library**: Google Text-to-Speech (gTTS) for pronunciation generation
- **Audio Delivery**: Temporary file generation and streaming to client
- **User Control**: Audio player controls for pronunciation playback
- **Volume Control**: Interactive volume slider with localStorage persistence and visual feedback
- **Speed Control**: Normal and slow pronunciation modes with toggle button
- **Download Support**: Direct audio file download with speed preference

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
- **googletrans**: Google Translate library for Korean translations

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