const STORAGE_KEY = 'richeRacsCart';

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
    return `$${Number(value).toFixed(2)}`;
}

function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(entry => entry.id === item.id && entry.size === item.size);
    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }
    saveCart(cart);
}

function removeFromCart(index) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        saveCart(cart);
    }
    return cart;
}

function updateCartItemQuantity(index, delta) {
    const cart = getCart();
    if (index < 0 || index >= cart.length) return cart;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart(cart);
    return cart;
}

function buildCartSummary(cart) {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return formatPrice(total);
}

function renderCartItems() {
    const cart = getCart();
    const cartTable = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const emptyState = document.getElementById('empty-cart');

    if (!cartTable || !cartTotal || !emptyState) return;

    if (cart.length === 0) {
        cartTable.innerHTML = '';
        cartTotal.textContent = '$0.00';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    cartTable.innerHTML = '';

    cart.forEach((item, index) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'cart-item';
        itemCard.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-meta">Size: ${item.size}</div>
            </div>
            <div class="item-quantity">
                <button class="qty-btn" data-action="decrease" data-index="${index}" type="button">−</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-action="increase" data-index="${index}" type="button">+</button>
            </div>
            <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
            <button class="item-remove" data-index="${index}">Remove</button>
        `;
        cartTable.appendChild(itemCard);
    });

    cartTotal.textContent = buildCartSummary(cart);
    cartTable.querySelectorAll('.item-remove').forEach(button => {
        button.addEventListener('click', () => {
            const index = Number(button.dataset.index);
            removeFromCart(index);
            renderCartItems();
        });
    });

    cartTable.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', () => {
            const index = Number(button.dataset.index);
            const delta = button.dataset.action === 'increase' ? 1 : -1;
            updateCartItemQuantity(index, delta);
            renderCartItems();
        });
    });
}

function setupProductPage() {
    const productCard = document.querySelector('.product-card[data-product-id]');
    if (!productCard) return;

    const productId = productCard.dataset.productId;
    const productName = productCard.dataset.productName;
    const productPrice = Number(productCard.dataset.productPrice);
    const sizeButtons = document.querySelectorAll('.size-options button');
    const addButton = document.querySelector('.btn-primary');
    const buyButton = document.querySelector('.btn-secondary');

    if (!productId || !productName || Number.isNaN(productPrice)) return;

    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.soldout === 'true') {
                button.classList.add('attempted');
                setTimeout(() => button.classList.remove('attempted'), 250);
                return;
            }
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    const getSelectedSize = () => {
        const active = document.querySelector('.size-options button.active');
        return active ? active.textContent.trim() : null;
    };

    const cartItemFromSelection = () => {
        const size = getSelectedSize();
        if (!size) return null;
        return {
            id: `${productId}-${size}`,
            name: productName,
            price: productPrice,
            size,
            quantity: 1
        };
    };

    if (addButton) {
        addButton.addEventListener('click', () => {
            const item = cartItemFromSelection();
            if (!item) return;
            addToCart(item);
            window.location.href = 'cart.html';
        });
    }

    if (buyButton) {
        buyButton.addEventListener('click', () => {
            const item = cartItemFromSelection();
            if (!item) return;
            addToCart(item);
            window.location.href = 'checkout.html';
        });
    }
}

function setupCartPage() {
    if (!document.getElementById('cart-items')) return;
    renderCartItems();
    const continueButton = document.getElementById('continue-shopping');
    if (continueButton) {
        continueButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'index.html';
        });
    }
}

function setupCheckoutPage() {
    const checkoutContainer = document.getElementById('checkout-container');
    const summaryTotal = document.getElementById('checkout-total');
    const checkoutButton = document.getElementById('checkout-button');
    const noCartNotice = document.getElementById('no-cart-notice');

    if (!checkoutContainer || !checkoutButton || !summaryTotal || !noCartNotice) return;

    const cart = getCart();
    if (cart.length === 0) {
        checkoutContainer.style.display = 'none';
        noCartNotice.style.display = 'block';
        return;
    }

    noCartNotice.style.display = 'none';
    checkoutContainer.style.display = 'block';

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    summaryTotal.textContent = formatPrice(totalAmount);

    const itemList = document.getElementById('checkout-items');
    if (itemList) {
        itemList.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <span>Size: ${item.size}</span><br>
                    <span>Qty: ${item.quantity}</span>
                </div>
                <div>${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('');
    }

    const stripe = Stripe('pk_test_51TMkyz1Ydrg4bKlcGchJCnH6Vcn29O5VrJP3CcDBebeUqF0aGduZEmZt23eHbh4fNY2eqkZqKYv96ZyCcpYYyfF800pU10e0iU');

    checkoutButton.addEventListener('click', async () => {
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Starting checkout...';

        try {
            const checkoutUrl = '/api/checkout';
            const response = await fetch(checkoutUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Checkout failed');
            }

            const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (result.error) {
                alert(result.error.message);
                checkoutButton.disabled = false;
                checkoutButton.textContent = 'Proceed to secure payment';
            }
        } catch (error) {
            alert(error.message || 'Unable to start checkout.');
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Proceed to secure payment';
        }
    });
}

function initPage() {
    setupProductPage();
    setupCartPage();
    setupCheckoutPage();
}

document.addEventListener('DOMContentLoaded', initPage);
