const STORAGE_KEY = 'richeRacsCart';
const SHIPPING_KEY = 'richeRacsShipping';

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

function getShippingInfo() {
    try {
        return JSON.parse(localStorage.getItem(SHIPPING_KEY) || 'null');
    } catch (error) {
        return null;
    }
}

function saveShippingInfo(info) {
    localStorage.setItem(SHIPPING_KEY, JSON.stringify(info));
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

function renderShippingSummary(shipping) {
    const container = document.getElementById('saved-shipping');
    if (!container) return;

    if (!shipping) {
        container.innerHTML = '<p style="margin:0; color:#ddd;">Shipping information not found. Please fill it out on the shipping page before continuing.</p>';
        return;
    }

    container.innerHTML = `
        <div class="checkout-item" style="flex-direction:column; gap:12px; padding:18px;">
            <div><strong>${shipping.name}</strong></div>
            <div>${shipping.line1}${shipping.line2 ? ', ' + shipping.line2 : ''}</div>
            <div>${shipping.city}, ${shipping.state} ${shipping.postal_code}</div>
            <div>${shipping.country}</div>
            <div>${shipping.email}</div>
            ${shipping.phone ? `<div>${shipping.phone}</div>` : ''}
        </div>
    `;
}

function renderShippingForm(shipping) {
    if (!shipping) return;
    const fieldMap = {
        'shipping-name': 'name',
        'shipping-email': 'email',
        'shipping-phone': 'phone',
        'shipping-line1': 'line1',
        'shipping-line2': 'line2',
        'shipping-city': 'city',
        'shipping-state': 'state',
        'shipping-postal-code': 'postal_code',
        'shipping-country': 'country'
    };
    Object.entries(fieldMap).forEach(([id, key]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = shipping[key] || '';
        }
    });
}

function setupShippingPage() {
    const shippingForm = document.getElementById('shipping-form');
    const emptyNotice = document.getElementById('shipping-empty');
    const cartSummary = document.getElementById('shipping-order-summary');
    const shipping = getShippingInfo();
    const cart = getCart();

    if (!shippingForm || !cartSummary || !emptyNotice) return;

    if (cart.length === 0) {
        shippingForm.style.display = 'none';
        emptyNotice.style.display = 'block';
        return;
    }

    emptyNotice.style.display = 'none';
    shippingForm.style.display = 'grid';

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartSummary.textContent = `${formatPrice(totalAmount)} + $5.00 shipping`;
    renderShippingForm(shipping);

    const submitButton = document.getElementById('shipping-submit');
    if (submitButton) {
        submitButton.addEventListener('click', (event) => {
            event.preventDefault();

            const newShipping = {
                name: document.getElementById('shipping-name')?.value.trim(),
                email: document.getElementById('shipping-email')?.value.trim(),
                phone: document.getElementById('shipping-phone')?.value.trim(),
                line1: document.getElementById('shipping-line1')?.value.trim(),
                line2: document.getElementById('shipping-line2')?.value.trim(),
                city: document.getElementById('shipping-city')?.value.trim(),
                state: document.getElementById('shipping-state')?.value.trim(),
                postal_code: document.getElementById('shipping-postal-code')?.value.trim(),
                country: document.getElementById('shipping-country')?.value
            };

            const requiredFields = [
                newShipping.name,
                newShipping.email,
                newShipping.line1,
                newShipping.city,
                newShipping.postal_code,
                newShipping.country
            ];

            if (requiredFields.some(value => !value)) {
                alert('Please complete all required shipping fields before continuing.');
                return;
            }

            saveShippingInfo(newShipping);
            window.location.href = 'checkout.html';
        });
    }
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
    const sizeButtons = document.querySelectorAll('.size-options button');
    const addButton = document.querySelector('.btn-primary');
    const buyButton = document.querySelector('.btn-secondary');
    const priceDisplay = document.getElementById('product-price');

    if (!productId || !productName) return;

    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.soldout === 'true') {
                button.classList.add('attempted');
                setTimeout(() => button.classList.remove('attempted'), 250);
                return;
            }
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (priceDisplay && button.dataset.price) {
                priceDisplay.textContent = `$${button.dataset.price} USD`;
            }
        });
    });

    const getSelectedSize = () => {
        const active = document.querySelector('.size-options button.active');
        return active ? active.textContent.trim() : null;
    };

    const getSelectedPrice = () => {
        const active = document.querySelector('.size-options button.active');
        return active && active.dataset.price ? Number(active.dataset.price) : null;
    };

    const initialPrice = getSelectedPrice();
    if (priceDisplay && initialPrice !== null) {
        priceDisplay.textContent = `$${initialPrice} USD`;
    }

    const cartItemFromSelection = () => {
        const size = getSelectedSize();
        const price = getSelectedPrice();
        if (!size || price === null) return null;
        return {
            id: `${productId}-${size}`,
            name: productName,
            price: price,
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
    const shippingNotice = document.getElementById('checkout-shipping-warning');
    const shippingSummary = document.getElementById('checkout-shipping');

    if (!checkoutContainer || !checkoutButton || !summaryTotal || !noCartNotice || !shippingNotice || !shippingSummary) return;

    const cart = getCart();
    if (cart.length === 0) {
        checkoutContainer.style.display = 'none';
        noCartNotice.style.display = 'block';
        shippingNotice.style.display = 'none';
        return;
    }

    noCartNotice.style.display = 'none';
    checkoutContainer.style.display = 'block';

    const shipping = getShippingInfo();
    if (!shipping) {
        shippingNotice.style.display = 'block';
        shippingSummary.style.display = 'none';
        checkoutButton.disabled = true;
        return;
    }

    shippingNotice.style.display = 'none';
    shippingSummary.style.display = 'block';
    renderShippingSummary(shipping);

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = totalAmount > 0 ? 5 : 0;
    const finalTotal = totalAmount + shippingCost;
    summaryTotal.textContent = formatPrice(finalTotal);

    const itemList = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
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
    if (subtotalEl) {
        subtotalEl.textContent = formatPrice(totalAmount);
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
                body: JSON.stringify({ cart, shipping })
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
    setupShippingPage();
    setupCheckoutPage();
}

document.addEventListener('DOMContentLoaded', initPage);
