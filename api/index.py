import os
import logging
import requests
import tempfile
from flask import Flask, render_template, request, send_file, flash, redirect, url_for, jsonify
from gtts import gTTS
from urllib.parse import quote
import time
from googletrans import Translator

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Vercel 환경에 맞는 경로 설정
if os.environ.get('VERCEL'):
    # Vercel 환경에서는 현재 디렉토리가 루트
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # api 폴더
    template_path = os.path.join(os.path.dirname(BASE_DIR), 'templates')  # 프로젝트 루트의 templates
    static_path = os.path.join(os.path.dirname(BASE_DIR), 'static')  # 프로젝트 루트의 static
else:
    # 로컬 개발 환경
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_path = os.path.join(BASE_DIR, 'templates')
    static_path = os.path.join(BASE_DIR, 'static')

app = Flask(__name__, 
           template_folder=template_path,
           static_folder=static_path)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Configuration
DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/{}"

# Initialize translator with error handling
try:
    translator = Translator()
except Exception as e:
    logging.error(f"Failed to initialize translator: {e}")
    translator = None

def translate_to_korean(text):
    """Translate English text to Korean using Google Translate"""
    if not translator:
        return text
        
    try:
        if not text or text.strip() == '':
            return text
            
        # Add rate limiting to avoid API limits
        time.sleep(0.1)
        
        result = translator.translate(text, src='en', dest='ko')
        
        # Handle both single result and list results
        if hasattr(result, 'text'):
            return result.text
        elif isinstance(result, list) and len(result) > 0 and hasattr(result[0], 'text'):
            return result[0].text
        else:
            return text
        
    except Exception as e:
        logging.error(f"Translation error for '{text}': {e}")
        return text

@app.route('/')
def index():
    """Main page with word search form"""
    try:
        return render_template('index.html')
    except Exception as e:
        logging.error(f"Error rendering index page: {e}")
        return f"Template error: {str(e)}", 500

@app.route('/search', methods=['POST'])
def search_word():
    """Search for word definition and redirect to word page"""
    word = request.form.get('word', '').strip().lower()
    
    if not word:
        flash('단어를 입력해주세요. (Please enter a word.)', 'error')
        return redirect(url_for('index'))
    
    # Enhanced validation - allow hyphens and apostrophes in words
    if not all(c.isalpha() or c in ['-', "'"] for c in word):
        flash('올바른 영어 단어를 입력해주세요. (Please enter a valid English word.)', 'error')
        return redirect(url_for('index'))
    
    return redirect(url_for('word_definition', word=word))

@app.route('/word/<word>')
def word_definition(word):
    """Display word definition"""
    word = word.strip().lower()
    
    try:
        # Call Dictionary API with timeout
        response = requests.get(DICTIONARY_API_URL.format(quote(word)), timeout=10)
        
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
                if translator:  # Only translate if translator is available
                    for meaning in meanings:
                        definitions = meaning.get('definitions', [])
                        for i, definition in enumerate(definitions):
                            if 'definition' in definition:
                                # Limit translations to avoid API overuse
                                if i < 3:  # Only translate first 3 definitions per meaning
                                    korean_definition = translate_to_korean(definition['definition'])
                                    definition['korean_definition'] = korean_definition
                                    
                                    # Also translate examples if they exist
                                    if 'example' in definition and definition['example']:
                                        korean_example = translate_to_korean(definition['example'])
                                        definition['korean_example'] = korean_example
                                
                                # Small delay to avoid overwhelming the API
                                time.sleep(0.2)
                
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
@app.route('/pronounce/<word>/<speed>')
def pronounce_word(word, speed='normal'):
    """Generate and serve pronunciation audio for the word"""
    word = word.strip().lower()
    is_slow = speed == 'slow'
    
    try:
        logging.info(f"Generating pronunciation for: {word} (speed: {speed})")
        
        # Validate word input
        if not word or not all(c.isalpha() or c in ['-', "'"] for c in word):
            return jsonify({'error': 'Invalid word'}), 400
        
        # Generate TTS audio with speed setting
        tts = gTTS(text=word, lang='en', slow=is_slow)
        
        # Create temporary file in Vercel's /tmp directory
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix='.mp3',
            dir='/tmp' if os.environ.get('VERCEL') else None
        )
        temp_file.close()  # Close file handle before writing
        
        # Save TTS to file
        tts.save(temp_file.name)
        logging.info(f"Audio file created: {temp_file.name}")
        
        # Clean up function for after sending file
        def remove_file(response):
            try:
                os.unlink(temp_file.name)
                logging.info(f"Cleaned up temporary file: {temp_file.name}")
            except Exception as e:
                logging.error(f"Error cleaning up temp file: {e}")
            return response
        
        # Send file with proper headers
        response = send_file(temp_file.name, 
                           mimetype='audio/mpeg',
                           as_attachment=False,
                           download_name=f'{word}_pronunciation_{speed}.mp3')
        
        # Schedule cleanup (Note: This might not work in serverless environments)
        response.call_on_close(lambda: remove_file(response))
        
        return response
                        
    except Exception as e:
        logging.error(f"Error generating pronunciation for '{word}': {e}")
        return jsonify({'error': f'Error generating pronunciation: {str(e)}'}), 500

@app.route('/api/random-word')
def random_word():
    """API endpoint to get a random word for the random word button"""
    popular_words = [
        'serendipity', 'eloquent', 'ephemeral', 'ubiquitous', 'magnificent',
        'resilient', 'innovative', 'fascinating', 'extraordinary', 'remarkable',
        'sophisticated', 'contemporary', 'fundamental', 'substantial', 'impressive',
        'significant', 'exceptional', 'revolutionary', 'unprecedented', 'influential',
        'ambitious', 'mysterious', 'brilliant', 'creative', 'dynamic',
        'authentic', 'versatile', 'comprehensive', 'distinctive', 'memorable'
    ]
    
    import random
    random_word = random.choice(popular_words)
    return jsonify({'word': random_word})

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors"""
    try:
        return render_template('index.html', error='페이지를 찾을 수 없습니다. (Page not found.)'), 404
    except:
        return "페이지를 찾을 수 없습니다. (Page not found.)", 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    try:
        return render_template('index.html', error='서버 오류가 발생했습니다. (Server error occurred.)'), 500
    except:
        return "서버 오류가 발생했습니다. (Server error occurred.)", 500

# Vercel handler function
def handler(environ, start_response):
    """Vercel WSGI handler"""
    return app(environ, start_response)

# For local development
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
