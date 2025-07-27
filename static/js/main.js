// English Dictionary App JavaScript

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeThemeToggle();
    initializeVolumeControl();
    initializeKeyboardShortcuts();
    initializeWordOfDay();
    initializeSpeechSpeed();
    initializeDownloadLinks();
});

// Popular English words for "Word of the Day"
const popularWords = [
    'serendipity', 'eloquent', 'ephemeral', 'ubiquitous', 'magnificent',
    'resilient', 'innovative', 'fascinating', 'extraordinary', 'remarkable',
    'sophisticated', 'contemporary', 'fundamental', 'substantial', 'impressive',
    'significant', 'exceptional', 'revolutionary', 'unprecedented', 'influential',
    'ambitious', 'mysterious', 'brilliant', 'creative', 'dynamic',
    'authentic', 'versatile', 'comprehensive', 'distinctive', 'memorable'
];

// Play pronunciation
function playPronunciation(word) {
    const btn = document.getElementById('pronounceBtn');
    const audio = document.getElementById('pronunciationAudio');
    
    if (!btn || !audio || !word) return;
    
    // Show loading state
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로딩 중... (Loading...)';
    btn.classList.add('btn-loading');
    btn.disabled = true;
    
    // Reset audio element
    audio.pause();
    audio.currentTime = 0;
    
    // Check if slow speech is enabled
    const isSlowSpeech = localStorage.getItem('slowSpeech') === 'true';
    const speed = isSlowSpeech ? 'slow' : 'normal';
    
    // Set audio source with speed parameter
    const audioUrl = `/pronounce/${encodeURIComponent(word)}/${speed}`;
    console.log('Loading audio from:', audioUrl);
    
    // Try multiple methods for audio playback
    
    // Method 1: Use existing audio element
    audio.src = audioUrl;
    audio.load();
    
    // Apply volume setting
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        audio.volume = volumeSlider.value / 100;
    } else {
        audio.volume = 0.7; // Default volume
    }
    
    // Handle audio events with multiple fallbacks
    let hasPlayed = false;
    
    audio.onloadstart = function() {
        console.log('Audio loading started');
    };
    
    audio.oncanplay = function() {
        console.log('Audio can start playing');
        if (!hasPlayed) {
            hasPlayed = true;
            tryPlayAudio();
        }
    };
    
    audio.oncanplaythrough = function() {
        console.log('Audio can play through');
        if (!hasPlayed) {
            hasPlayed = true;
            tryPlayAudio();
        }
    };
    
    audio.onended = function() {
        console.log('Audio finished playing');
        resetButton();
    };
    
    audio.onerror = function(e) {
        console.error('Audio error:', e);
        console.log('Trying fallback method...');
        
        // Fallback: Create new audio element
        const fallbackAudio = new Audio(audioUrl);
        fallbackAudio.volume = audio.volume;
        
        fallbackAudio.oncanplay = function() {
            fallbackAudio.play().then(() => {
                console.log('Fallback audio playing successfully');
            }).catch(error => {
                console.error('Fallback audio also failed:', error);
                resetButton();
                alert('발음을 재생할 수 없습니다. 브라우저에서 오디오 재생을 허용해주세요.');
            });
        };
        
        fallbackAudio.onended = function() {
            resetButton();
        };
        
        fallbackAudio.onerror = function() {
            resetButton();
            alert('발음을 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
        };
        
        fallbackAudio.load();
    };
    
    function tryPlayAudio() {
        audio.play().then(() => {
            console.log('Audio playing successfully');
        }).catch(error => {
            console.error('Error playing audio:', error);
            
            // User interaction may be required
            if (error.name === 'NotAllowedError') {
                resetButton();
                alert('브라우저에서 자동 재생이 차단되었습니다. 다시 클릭해주세요.');
            } else {
                // Try again after a short delay
                setTimeout(() => {
                    audio.play().catch(() => {
                        resetButton();
                        alert('발음을 재생할 수 없습니다.');
                    });
                }, 100);
            }
        });
    }
    
    function resetButton() {
        btn.innerHTML = originalContent;
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
    
    // Fallback timeout
    setTimeout(() => {
        if (btn.disabled) {
            console.log('Timeout reached, resetting button');
            resetButton();
        }
    }, 10000); // 10 second timeout
}

// Volume control functionality
function initializeVolumeControl() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeDisplay = document.getElementById('volumeDisplay');
    const audio = document.getElementById('pronunciationAudio');
    
    if (!volumeSlider || !volumeDisplay || !audio) return;
    
    // Load saved volume from localStorage or default to 70%
    const savedVolume = localStorage.getItem('audioVolume') || 70;
    volumeSlider.value = savedVolume;
    volumeDisplay.textContent = savedVolume + '%';
    audio.volume = savedVolume / 100;
    
    // Add event listener for volume changes
    volumeSlider.addEventListener('input', function() {
        const volume = this.value;
        audio.volume = volume / 100;
        volumeDisplay.textContent = volume + '%';
        localStorage.setItem('audioVolume', volume);
        
        // Update volume icon based on level
        updateVolumeIcons(volume);
    });
    
    // Initialize volume icons
    updateVolumeIcons(savedVolume);
}

// Update volume icons based on volume level
function updateVolumeIcons(volume) {
    const volumeControl = document.querySelector('.volume-control');
    if (!volumeControl) return;
    
    const lowIcon = volumeControl.querySelector('.fa-volume-down');
    const highIcon = volumeControl.querySelector('.fa-volume-up');
    
    if (lowIcon && highIcon) {
        // Reset all icons
        lowIcon.className = 'fas text-muted';
        highIcon.className = 'fas text-muted';
        
        if (volume == 0) {
            lowIcon.className = 'fas fa-volume-mute text-danger';
            highIcon.className = 'fas fa-volume-up text-muted';
        } else if (volume <= 30) {
            lowIcon.className = 'fas fa-volume-down text-warning';
            highIcon.className = 'fas fa-volume-up text-muted';
        } else if (volume <= 70) {
            lowIcon.className = 'fas fa-volume-down text-muted';
            highIcon.className = 'fas fa-volume-up text-info';
        } else {
            lowIcon.className = 'fas fa-volume-down text-muted';
            highIcon.className = 'fas fa-volume-up text-success';
        }
    }
}

// Theme toggle functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;
    
    if (!themeToggle || !themeIcon || !themeText) return;
    
    // Get saved theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Add click event listener
    themeToggle.addEventListener('click', function() {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    function setTheme(theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        
        // Manage dark theme CSS file
        const darkThemeCSS = document.getElementById('darkThemeCSS');
        
        if (theme === 'dark') {
            // Enable dark theme CSS
            if (darkThemeCSS) {
                darkThemeCSS.disabled = false;
            }
            themeIcon.className = 'fas fa-sun me-1';
            themeText.textContent = '밝은 모드 (Light Mode)';
            themeToggle.className = 'btn btn-outline-warning';
        } else {
            // Disable dark theme CSS to use default light theme
            if (darkThemeCSS) {
                darkThemeCSS.disabled = true;
            }
            themeIcon.className = 'fas fa-moon me-1';
            themeText.textContent = '다크 모드 (Dark Mode)';
            themeToggle.className = 'btn btn-outline-secondary';
        }
    }
}

// Keyboard shortcuts functionality
function initializeKeyboardShortcuts() {
    const wordInput = document.getElementById('wordInput');
    const clearBtn = document.getElementById('clearBtn');
    const searchForm = document.getElementById('searchForm');
    
    if (!wordInput || !clearBtn || !searchForm) return;
    
    // Add keyboard event listeners
    document.addEventListener('keydown', function(e) {
        // Escape key to clear input
        if (e.key === 'Escape') {
            wordInput.value = '';
            wordInput.focus();
            e.preventDefault();
        }
    });
    
    // Clear button functionality
    clearBtn.addEventListener('click', function() {
        wordInput.value = '';
        wordInput.focus();
    });
    
    // Focus on input when page loads
    wordInput.focus();
}

// Word of the Day functionality
function initializeWordOfDay() {
    const wordOfDayBtn = document.getElementById('wordOfDayBtn');
    if (!wordOfDayBtn) return;
    
    wordOfDayBtn.addEventListener('click', function() {
        // Get today's word based on date
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const wordIndex = dayOfYear % popularWords.length;
        const todaysWord = popularWords[wordIndex];
        
        // Fill input and search
        const wordInput = document.getElementById('wordInput');
        if (wordInput) {
            wordInput.value = todaysWord;
            
            // Show loading state
            const originalText = wordOfDayBtn.innerHTML;
            wordOfDayBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>로딩 중...';
            wordOfDayBtn.disabled = true;
            
            // Submit search
            document.getElementById('searchForm').submit();
        }
    });
}

// Speech speed control
function initializeSpeechSpeed() {
    const speedToggle = document.getElementById('speedToggle');
    if (!speedToggle) return;
    
    // Load saved speed preference
    const isSlowSpeech = localStorage.getItem('slowSpeech') === 'true';
    updateSpeedToggleUI(isSlowSpeech);
    
    speedToggle.addEventListener('click', function() {
        const currentSpeed = localStorage.getItem('slowSpeech') === 'true';
        const newSpeed = !currentSpeed;
        localStorage.setItem('slowSpeech', newSpeed);
        updateSpeedToggleUI(newSpeed);
    });
    
    function updateSpeedToggleUI(isSlowSpeech) {
        if (isSlowSpeech) {
            speedToggle.className = 'btn btn-warning';
            speedToggle.innerHTML = '<i class="fas fa-turtle me-1"></i>느린 발음 (ON)';
        } else {
            speedToggle.className = 'btn btn-outline-warning';
            speedToggle.innerHTML = '<i class="fas fa-tachometer-alt me-1"></i>느린 발음 (Slow Speech)';
        }
        
        // Update download links when speed changes
        updateDownloadLinks();
    }
}

// Update download links with speed setting
function initializeDownloadLinks() {
    updateDownloadLinks();
    
    // Update download links when speed changes
    const speedToggle = document.getElementById('speedToggle');
    if (speedToggle) {
        speedToggle.addEventListener('click', function() {
            // Wait for localStorage to be updated
            setTimeout(updateDownloadLinks, 100);
        });
    }
}

function updateDownloadLinks() {
    const downloadLinks = document.querySelectorAll('.download-link');
    downloadLinks.forEach(link => {
        const word = link.getAttribute('data-word');
        if (word) {
            const isSlowSpeech = localStorage.getItem('slowSpeech') === 'true';
            const speed = isSlowSpeech ? 'slow' : 'normal';
            link.href = `/pronounce/${encodeURIComponent(word)}/${speed}`;
        }
    });
}