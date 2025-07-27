// English Dictionary App JavaScript

// Search history management - now uses database
let searchHistory = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSearchHistoryFromDatabase();
});

// Get current word from URL or form
function getCurrentWord() {
    const path = window.location.pathname;
    const wordMatch = path.match(/\/word\/(.+)/);
    if (wordMatch) {
        return decodeURIComponent(wordMatch[1]);
    }
    return null;
}

// Load search history from database
function loadSearchHistoryFromDatabase() {
    fetch('/api/search_history')
        .then(response => response.json())
        .then(data => {
            searchHistory = data;
            updateSearchHistoryDisplay();
        })
        .catch(error => {
            console.error('Error loading search history:', error);
            searchHistory = [];
            updateSearchHistoryDisplay();
        });
}

// Update search history display
function updateSearchHistoryDisplay() {
    const historyContainer = document.getElementById('searchHistory');
    
    if (!historyContainer) return;
    
    if (searchHistory.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted">검색한 단어가 여기에 표시됩니다. (Searched words will appear here.)</p>';
        return;
    }
    
    let historyHTML = '';
    searchHistory.forEach(word => {
        historyHTML += `
            <div class="search-history-item">
                <a href="/word/${encodeURIComponent(word)}" class="btn btn-outline-secondary btn-sm">
                    ${word}
                </a>
            </div>
        `;
    });
    
    historyContainer.innerHTML = historyHTML;
}

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
    
    // Handle audio load
    audio.addEventListener('loadeddata', function() {
        // Reset button
        btn.innerHTML = originalContent;
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        
        // Play audio
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('발음 재생 중 오류가 발생했습니다. (Error playing pronunciation.)');
        });
    }, { once: true });
    
    // Handle audio error
    audio.addEventListener('error', function() {
        // Reset button
        btn.innerHTML = originalContent;
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        
        alert('발음을 로드할 수 없습니다. (Cannot load pronunciation.)');
    }, { once: true });
    
    // Load the audio
    audio.load();
}

// Clear search history
function clearSearchHistory() {
    if (confirm('검색 기록을 모두 삭제하시겠습니까? (Do you want to clear all search history?)')) {
        // Note: Database search history is cleared automatically by server-side logic
        // Here we just clear the local display
        searchHistory = [];
        updateSearchHistoryDisplay();
    }
}

// Form validation
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const wordInput = searchForm.querySelector('input[name="word"]');
            const word = wordInput.value.trim();
            
            if (!word) {
                e.preventDefault();
                alert('단어를 입력해주세요. (Please enter a word.)');
                wordInput.focus();
                return;
            }
            
            // Basic validation - only letters and common punctuation
            if (!/^[a-zA-Z\s'-]+$/.test(word)) {
                e.preventDefault();
                alert('올바른 영어 단어를 입력해주세요. (Please enter a valid English word.)');
                wordInput.focus();
                return;
            }
        });
    }
});

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.classList.contains('show')) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Focus search input on '/' key
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[name="word"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Play pronunciation on 'P' key when on word page
    if (e.key === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const currentWord = getCurrentWord();
        if (currentWord) {
            e.preventDefault();
            playPronunciation(currentWord);
        }
    }
});
