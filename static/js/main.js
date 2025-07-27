// English Dictionary App JavaScript

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    initializeThemeToggle();
    initializeVolumeControl();
    initializeKeyboardShortcuts();
    initializeRandomWord();
    initializeSpeechSpeed();
    initializeClearButton();
    
    console.log('All components initialized');
});

// Popular English words for random selection
const popularWords = [
    'serendipity', 'eloquent', 'ephemeral', 'ubiquitous', 'magnificent',
    'resilient', 'innovative', 'fascinating', 'extraordinary', 'remarkable',
    'sophisticated', 'contemporary', 'fundamental', 'substantial', 'impressive',
    'significant', 'exceptional', 'revolutionary', 'unprecedented', 'influential',
    'ambitious', 'mysterious', 'brilliant', 'creative', 'dynamic',
    'authentic', 'versatile', 'comprehensive', 'distinctive', 'memorable'
];

// Play pronunciation - 단순화된 버전
function playPronunciation(word) {
    console.log('Playing pronunciation for:', word);
    
    const btn = document.getElementById('pronounceBtn');
    const audio = document.getElementById('pronunciationAudio');
    
    if (!btn || !audio || !word) {
        console.error('Missing elements for pronunciation');
        return;
    }
    
    // Show loading state
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로딩 중... (Loading...)';
    btn.disabled = true;
    
    // Reset audio
    audio.pause();
    audio.currentTime = 0;
    
    // Simple URL without speed parameter first
    const audioUrl = `/pronounce/${encodeURIComponent(word)}`;
    console.log('Loading audio from:', audioUrl);
    
    // Set volume
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        audio.volume = volumeSlider.value / 100;
    } else {
        audio.volume = 0.7;
    }
    
    // Set source and load
    audio.src = audioUrl;
    audio.load();
    
    // Simple event handlers
    audio.oncanplaythrough = function() {
        console.log('Audio ready to play');
        audio.play().then(() => {
            console.log('Audio playing successfully');
        }).catch(error => {
            console.error('Error playing audio:', error);
            resetButton();
            alert('발음을 재생할 수 없습니다. 다시 시도해주세요.');
        });
    };
    
    audio.onended = function() {
        console.log('Audio finished');
        resetButton();
    };
    
    audio.onerror = function(e) {
        console.error('Audio loading error:', e);
        resetButton();
        alert('발음 파일을 불러올 수 없습니다.');
    };
    
    function resetButton() {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
    
    // Safety timeout
    setTimeout(() => {
        if (btn.disabled) {
            console.log('Timeout reached, resetting button');
            resetButton();
        }
    }, 10000);
}

// Volume control functionality
function initializeVolumeControl() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeDisplay = document.getElementById('volumeDisplay');
    
    if (!volumeSlider || !volumeDisplay) return;
    
    console.log('Initializing volume control...');
    
    // Load saved volume
    const savedVolume = localStorage.getItem('audioVolume') || 70;
    volumeSlider.value = savedVolume;
    volumeDisplay.textContent = savedVolume + '%';
    
    // Volume change handler
    volumeSlider.addEventListener('input', function() {
        const volume = this.value;
        volumeDisplay.textContent = volume + '%';
        localStorage.setItem('audioVolume', volume);
        console.log('Volume changed to:', volume);
    });
    
    console.log('Volume control initialized');
}

// Theme toggle functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;
    
    if (!themeToggle || !themeIcon || !themeText) {
        console.error('Theme toggle elements not found');
        return;
    }
    
    console.log('Initializing theme toggle...');
    
    // Get saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Click handler
    themeToggle.addEventListener('click', function() {
        console.log('Theme toggle clicked');
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    function setTheme(theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun me-1';
            themeText.textContent = '밝은 모드 (Light Mode)';
            themeToggle.className = 'btn btn-warning';
        } else {
            themeIcon.className = 'fas fa-moon me-1';
            themeText.textContent = '다크 모드 (Dark Mode)';
            themeToggle.className = 'btn btn-outline-secondary';
        }
        
        console.log('Theme set to:', theme);
    }
    
    console.log('Theme toggle initialized');
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    const wordInput = document.getElementById('wordInput');
    
    if (!wordInput) return;
    
    console.log('Initializing keyboard shortcuts...');
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            wordInput.value = '';
            wordInput.focus();
            console.log('Input cleared with Escape key');
        }
    });
    
    // Focus on input
    wordInput.focus();
    
    console.log('Keyboard shortcuts initialized');
}

// Random word functionality
function initializeRandomWord() {
    const randomWordBtn = document.getElementById('randomWordBtn');
    const wordInput = document.getElementById('wordInput');
    const searchForm = document.getElementById('searchForm');
    
    if (!randomWordBtn || !wordInput || !searchForm) {
        console.error('Random word elements not found');
        return;
    }
    
    console.log('Initializing random word...');
    
    randomWordBtn.addEventListener('click', function() {
        console.log('Random word button clicked');
        
        const randomIndex = Math.floor(Math.random() * popularWords.length);
        const randomWord = popularWords[randomIndex];
        
        console.log('Selected random word:', randomWord);
        
        wordInput.value = randomWord;
        searchForm.submit();
    });
    
    console.log('Random word initialized');
}

// Speech speed toggle
function initializeSpeechSpeed() {
    const speedToggle = document.getElementById('speedToggle');
    
    if (!speedToggle) {
        console.error('Speed toggle not found');
        return;
    }
    
    console.log('Initializing speech speed...');
    
    let isSlowSpeech = localStorage.getItem('slowSpeech') === 'true';
    updateSpeedUI(isSlowSpeech);
    
    speedToggle.addEventListener('click', function() {
        console.log('Speed toggle clicked');
        isSlowSpeech = !isSlowSpeech;
        localStorage.setItem('slowSpeech', isSlowSpeech);
        updateSpeedUI(isSlowSpeech);
    });
    
    function updateSpeedUI(isSlow) {
        if (isSlow) {
            speedToggle.className = 'btn btn-warning';
            speedToggle.innerHTML = '<i class="fas fa-turtle me-1"></i>느린 발음 (ON)';
        } else {
            speedToggle.className = 'btn btn-outline-warning';
            speedToggle.innerHTML = '<i class="fas fa-tachometer-alt me-1"></i>느린 발음 (Slow Speech)';
        }
        console.log('Speed UI updated, slow speech:', isSlow);
    }
    
    console.log('Speech speed initialized');
}

// Clear button functionality
function initializeClearButton() {
    const clearBtn = document.getElementById('clearBtn');
    const wordInput = document.getElementById('wordInput');
    
    if (!clearBtn || !wordInput) return;
    
    console.log('Initializing clear button...');
    
    clearBtn.addEventListener('click', function() {
        console.log('Clear button clicked');
        wordInput.value = '';
        wordInput.focus();
    });
    
    console.log('Clear button initialized');
}
