// English Dictionary App JavaScript

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeThemeToggle();
});

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
    
    // Set audio source and play
    audio.src = `/pronounce/${encodeURIComponent(word)}`;
    
    // Handle audio events
    audio.onloadstart = function() {
        console.log('Audio loading started');
    };
    
    audio.oncanplay = function() {
        console.log('Audio can start playing');
        audio.play().then(() => {
            console.log('Audio playing successfully');
        }).catch(error => {
            console.error('Error playing audio:', error);
            alert('발음을 재생할 수 없습니다. (Cannot play pronunciation.)');
        });
    };
    
    audio.onended = function() {
        console.log('Audio finished playing');
        // Reset button state
        btn.innerHTML = originalContent;
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    };
    
    audio.onerror = function(e) {
        console.error('Audio error:', e);
        alert('발음을 불러올 수 없습니다. (Cannot load pronunciation.)');
        // Reset button state
        btn.innerHTML = originalContent;
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    };
    
    // Also reset button state after a timeout as fallback
    setTimeout(() => {
        if (btn.disabled) {
            btn.innerHTML = originalContent;
            btn.classList.remove('btn-loading');
            btn.disabled = false;
        }
    }, 10000); // 10 second timeout
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