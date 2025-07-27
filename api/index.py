import os
import logging
import requests
import tempfile
from flask import Flask, render_template, request, send_file, flash, redirect, url_for
from gtts import gTTS
from urllib.parse import quote
import time
from googletrans import Translator
from flask import Flask

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

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

@app.route("/")
def home():
    return "Hello, Vercel Flask!"

@app.route('/favicon.png')
def favicon_png():
    return '', 204

@app.route("/favicon.ico")
def favicon():
    return "", 204  # No Content 응답

@app.route('/word/<word>')
def word_definition(word):
    """Display word definition"""
    word = word.strip().lower()
    
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

@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html', error='페이지를 찾을 수 없습니다. (Page not found.)'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('index.html', error='서버 오류가 발생했습니다. (Server error occurred.)'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
