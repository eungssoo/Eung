import os
import logging
import requests
import tempfile
from flask import Flask, render_template, request, send_file, flash, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from gtts import gTTS
from urllib.parse import quote
import json
import time
from datetime import datetime
from googletrans import Translator

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

# Create the app and database
db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

# Database Models
class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    searched_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))  # IPv6 support
    
    def __repr__(self):
        return f'<SearchHistory {self.word}>'

class FavoriteWord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    definition = db.Column(db.Text)
    korean_translation = db.Column(db.Text)
    added_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))  # IPv6 support
    
    def __repr__(self):
        return f'<FavoriteWord {self.word}>'

# Create database tables
with app.app_context():
    db.create_all()

# Configuration
DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/{}"

# Initialize translator
translator = Translator()

def translate_to_korean(text):
    """Translate English text to Korean using Google Translate"""
    try:
        if not text or text.strip() == '':
            return text
            
        result = translator.translate(text, src='en', dest='ko')
        # Handle both single result and list results
        if hasattr(result, 'text'):
            return result.text
        elif isinstance(result, list) and len(result) > 0 and hasattr(result[0], 'text'):
            return result[0].text
        else:
            return text
        
    except Exception as e:
        logging.error(f"Translation error: {e}")
        return text

@app.route('/')
def index():
    """Main page with word search form"""
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search_word():
    """Search for word definition and redirect to word page"""
    word = request.form.get('word', '').strip().lower()
    
    if not word:
        flash('단어를 입력해주세요. (Please enter a word.)', 'error')
        return redirect(url_for('index'))
    
    # Validate word (basic validation - only letters)
    if not word.isalpha():
        flash('올바른 영어 단어를 입력해주세요. (Please enter a valid English word.)', 'error')
        return redirect(url_for('index'))
    
    return redirect(url_for('word_definition', word=word))

@app.route('/word/<word>')
def word_definition(word):
    """Display word definition and provide pronunciation"""
    word = word.strip().lower()
    
    # Save to search history
    try:
        search_entry = SearchHistory(
            word=word,
            ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        )
        db.session.add(search_entry)
        db.session.commit()
    except Exception as e:
        logging.error(f"Error saving search history: {e}")
        db.session.rollback()
    
    try:
        # Call Dictionary API
        response = requests.get(DICTIONARY_API_URL.format(quote(word)))
        
        if response.status_code == 200:
            data = response.json()
            word_data = data[0] if data else None
            
            if word_data:
                # Extract phonetics
                phonetics = word_data.get('phonetics', [])
                phonetic_text = None
                for phonetic in phonetics:
                    if phonetic.get('text'):
                        phonetic_text = phonetic.get('text')
                        break
                
                # Extract meanings and translate definitions to Korean
                meanings = word_data.get('meanings', [])
                
                # Add Korean translations to definitions
                for meaning in meanings:
                    definitions = meaning.get('definitions', [])
                    for definition in definitions:
                        if 'definition' in definition:
                            # Translate the definition to Korean
                            korean_definition = translate_to_korean(definition['definition'])
                            definition['korean_definition'] = korean_definition
                            
                            # Also translate examples if they exist
                            if 'example' in definition and definition['example']:
                                korean_example = translate_to_korean(definition['example'])
                                definition['korean_example'] = korean_example
                            
                            # Small delay to avoid overwhelming the free API
                            time.sleep(0.1)
                
                return render_template('index.html', 
                                     word=word, 
                                     word_data=word_data,
                                     phonetic=phonetic_text,
                                     meanings=meanings,
                                     show_results=True)
            else:
                flash(f"'{word}'의 의미를 찾을 수 없습니다. (Definition for '{word}' not found.)", 'error')
                return redirect(url_for('index'))
        
        elif response.status_code == 404:
            flash(f"'{word}'의 의미를 찾을 수 없습니다. (Definition for '{word}' not found.)", 'error')
            return redirect(url_for('index'))
        else:
            flash('사전 API에 연결할 수 없습니다. (Cannot connect to dictionary API.)', 'error')
            return redirect(url_for('index'))
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Dictionary API request failed: {e}")
        flash('사전 API에 연결할 수 없습니다. (Cannot connect to dictionary API.)', 'error')
        return redirect(url_for('index'))
    except Exception as e:
        logging.error(f"Error processing word definition: {e}")
        flash('단어 검색 중 오류가 발생했습니다. (An error occurred while searching for the word.)', 'error')
        return redirect(url_for('index'))

@app.route('/pronounce/<word>')
def pronounce_word(word):
    """Generate and serve pronunciation audio for the word"""
    word = word.strip().lower()
    
    try:
        # Generate TTS audio
        tts = gTTS(text=word, lang='en', slow=False)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        
        return send_file(temp_file.name, 
                        mimetype='audio/mpeg',
                        as_attachment=False,
                        download_name=f'{word}_pronunciation.mp3')
                        
    except Exception as e:
        logging.error(f"Error generating pronunciation: {e}")
        flash('발음 생성 중 오류가 발생했습니다. (An error occurred while generating pronunciation.)', 'error')
        return redirect(url_for('word_definition', word=word))

@app.route('/favorite/<word>', methods=['POST'])
def add_to_favorites(word):
    """Add word to favorites"""
    word = word.strip().lower()
    
    try:
        # Check if already in favorites
        existing = FavoriteWord.query.filter_by(
            word=word,
            ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        ).first()
        
        if existing:
            flash(f"'{word}'은(는) 이미 즐겨찾기에 있습니다. ('{word}' is already in favorites.)", 'info')
        else:
            # Get definition and Korean translation for storage
            response = requests.get(DICTIONARY_API_URL.format(quote(word)))
            definition_text = ""
            korean_text = ""
            
            if response.status_code == 200:
                data = response.json()
                if data and data[0].get('meanings'):
                    first_definition = data[0]['meanings'][0]['definitions'][0]['definition']
                    definition_text = first_definition
                    korean_text = translate_to_korean(first_definition)
            
            favorite = FavoriteWord(
                word=word,
                definition=definition_text,
                korean_translation=korean_text,
                ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
            )
            db.session.add(favorite)
            db.session.commit()
            flash(f"'{word}'을(를) 즐겨찾기에 추가했습니다. (Added '{word}' to favorites.)", 'success')
            
    except Exception as e:
        logging.error(f"Error adding to favorites: {e}")
        flash('즐겨찾기 추가 중 오류가 발생했습니다. (Error adding to favorites.)', 'error')
        db.session.rollback()
    
    return redirect(url_for('word_definition', word=word))

@app.route('/favorites')
def view_favorites():
    """View all favorite words"""
    try:
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        favorites = FavoriteWord.query.filter_by(ip_address=ip_address)\
                                    .order_by(FavoriteWord.added_at.desc()).all()
        return render_template('favorites.html', favorites=favorites)
    except Exception as e:
        logging.error(f"Error loading favorites: {e}")
        flash('즐겨찾기를 불러오는 중 오류가 발생했습니다. (Error loading favorites.)', 'error')
        return redirect(url_for('index'))

@app.route('/remove_favorite/<int:favorite_id>', methods=['POST'])
def remove_favorite(favorite_id):
    """Remove word from favorites"""
    try:
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        favorite = FavoriteWord.query.filter_by(id=favorite_id, ip_address=ip_address).first()
        
        if favorite:
            db.session.delete(favorite)
            db.session.commit()
            flash(f"'{favorite.word}'을(를) 즐겨찾기에서 제거했습니다. (Removed '{favorite.word}' from favorites.)", 'info')
        else:
            flash('즐겨찾기 항목을 찾을 수 없습니다. (Favorite item not found.)', 'error')
            
    except Exception as e:
        logging.error(f"Error removing favorite: {e}")
        flash('즐겨찾기 제거 중 오류가 발생했습니다. (Error removing favorite.)', 'error')
        db.session.rollback()
    
    return redirect(url_for('view_favorites'))

@app.route('/api/search_history')
def get_search_history():
    """Get recent search history from database"""
    try:
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        # Use subquery to get distinct words with their latest search date
        subquery = db.session.query(
            SearchHistory.word,
            db.func.max(SearchHistory.searched_at).label('latest_search')
        ).filter_by(ip_address=ip_address)\
         .group_by(SearchHistory.word)\
         .subquery()
        
        recent_searches = db.session.query(subquery.c.word)\
                                  .order_by(subquery.c.latest_search.desc())\
                                  .limit(10).all()
        
        words = [search.word for search in recent_searches]
        return jsonify(words)
    except Exception as e:
        logging.error(f"Error getting search history: {e}")
        return jsonify([])

@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html', error='페이지를 찾을 수 없습니다. (Page not found.)'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('index.html', error='서버 오류가 발생했습니다. (Server error occurred.)'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
