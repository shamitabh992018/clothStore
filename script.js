const sliderImages = [
    "images/bgimage1.jpg",
    "images/bgimage2.jpg",
    "images/bgimage3.jpg"
];

let currentImageIndex = 0;
const sliderImageElement = document.getElementById("slider-image");

if (sliderImageElement) {
    // initial image
    sliderImageElement.src = sliderImages[0];
    sliderImageElement.style.transition = "opacity 0.6s ease-in-out";
    
    // Change image every 3 seconds
    setInterval(() => {
        sliderImageElement.style.opacity = "0";
        
        setTimeout(() => {
            currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
            sliderImageElement.src = sliderImages[currentImageIndex];
            
            // Fade in
            sliderImageElement.style.opacity = "1";
        }, 600); 
    }, 3500); 
}

// cart js
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// show more / show less
document.addEventListener('DOMContentLoaded', () => {
    const showMoreButton = document.getElementById("show-more-btn");
    const showLessButton = document.getElementById("show-less-btn");
    
    if (showMoreButton && showLessButton) {
        document.querySelectorAll(".hidden-product").forEach(product => {
            product.style.display = "none";
        });

        // Show More button 
        showMoreButton.onclick = () => {
            document.querySelectorAll(".hidden-product").forEach(product => {
                product.style.display = "block";
            });
            showMoreButton.style.display = "none";
            showLessButton.style.display = "inline-block";
        };

        // Show Less button
        showLessButton.onclick = () => {
            document.querySelectorAll(".hidden-product").forEach(product => {
                product.style.display = "none";
            });
            showLessButton.style.display = "none";
            showMoreButton.style.display = "inline-block";
        };
        
        showLessButton.style.display = "none";
    }

    // search function 
    const searchInput = document.getElementById("search-products");
    if (searchInput) {
        searchInput.addEventListener("keyup", function() {
            const searchTerm = this.value.toLowerCase().trim();
            document.querySelectorAll(".product-item").forEach(product => {
                const productName = product.querySelector(".product-name")?.innerText.toLowerCase() || "";
                const shouldShow = productName.includes(searchTerm);
                product.style.display = shouldShow ? "block" : "none";
            });
        });
    }

    // Update cart count on page load
    updateCartCount();
});

// add to cart function 
document.querySelectorAll(".add-to-cart-btn").forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const product = {
            name: button.dataset.name,
            price: Number(button.dataset.price) || 0,
            img: button.dataset.img,
            quantity: 1
        };

        // Check if product already exists in cart
        const existingProduct = cart.find(item => item.name === product.name);
        
        if (existingProduct) {
            existingProduct.quantity = Number(existingProduct.quantity) + 1;
        } else {
            cart.push(product);
        }

        // Save to localStorage
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
        
        button.textContent = "✓ Added!";
        setTimeout(() => {
            button.textContent = "Add to Cart";
        }, 1000);
    });
});

// cart count  
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart count badge in navbar
    const cartLink = document.querySelector('a[href="cart.html"]');
    if (cartLink) {
        let countBadge = document.getElementById("cart-count-badge");
        if (!countBadge) {
            countBadge = document.createElement("span");
            countBadge.id = "cart-count-badge";
            countBadge.className = "cart-count-badge";
            cartLink.style.position = "relative";
            cartLink.appendChild(countBadge);
        }
        countBadge.textContent = totalItems;
        countBadge.style.display = totalItems > 0 ? "inline-block" : "none";
    }
}

// display cart items 
function displayCart() {
    const cartContainer = document.getElementById("cart-items-container");
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        document.getElementById("cart-total").innerText = "Total ₹ 0";
        return;
    }

    let totalAmount = 0;
    cartContainer.innerHTML = "";

    cart.forEach((item, index) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const itemTotal = price * quantity;
        
        totalAmount += itemTotal;
        
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <img src="${item.img}" alt="${item.name}" loading="lazy">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>₹${price}</p>
            </div>
            <div class="quantity-control">
                <button class="quantity-btn" onclick="changeQuantity(${index}, -1)">-</button>
                <span class="quantity-value">${quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity(${index}, 1)">+</button>
            </div>
            <p>₹${itemTotal}</p>
            <button class="remove-item-btn" onclick="removeItem(${index})">Remove</button>
        `;
        cartContainer.appendChild(cartItem);
    });

    document.getElementById("cart-total").innerText = `Total ₹ ${totalAmount}`;
}

// change quantity  
window.changeQuantity = (index, change) => {
    cart[index].quantity = Number(cart[index].quantity) || 1;
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
    updateCartCount();
};

// remove products  
window.removeItem = (index) => {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
    updateCartCount();
};


// load cart on page  
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("cart-items-container")) {
        displayCart();
    }
});

