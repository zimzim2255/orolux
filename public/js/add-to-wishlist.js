async function addToWishlist(productId) {
    try {
        const response = await fetch(`/wishlist/add/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showToast('Item added to wishlist');
        } else {
            showToast('Error adding item to wishlist');
        }
    } catch (error) {
        showToast('Error adding item to wishlist');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        // Create toast element if it doesn't exist
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = 'toast-notification';
        document.body.appendChild(newToast);
    }
    
    const toastElement = document.getElementById('toast');
    toastElement.textContent = message;
    toastElement.classList.add('show');
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}
