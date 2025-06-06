document.addEventListener('DOMContentLoaded', function() {
    const languageToggle = document.getElementById('languageToggle');
    const languageMenu = document.getElementById('languageMenu');
    
    // Initialize language toggle functionality

    if (languageToggle && languageMenu) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            languageMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', function(e) {
            if (!languageMenu.contains(e.target)) {
                languageMenu.classList.add('hidden');
            }
        });
    }
});
