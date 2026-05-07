require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const path = require('path');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const domain = process.env.DOMAIN || 'http://localhost:3000';

if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY in .env');
    process.exit(1);
}

const stripe = Stripe(stripeKey);
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post(['/create-checkout-session', '/api/checkout'], async (req, res) => {
    const cart = Array.isArray(req.body.cart) ? req.body.cart : [];
    const shipping = req.body.shipping && typeof req.body.shipping === 'object' ? req.body.shipping : {};

    if (cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    const requiredShipping = [shipping.name, shipping.email, shipping.line1, shipping.city, shipping.postal_code, shipping.country];
    if (requiredShipping.some(value => !value)) {
        return res.status(400).json({ error: 'Shipping details are incomplete' });
    }

    const metadata = {};
    const metadataFields = {
        name: 'shipping_name',
        email: 'customer_email',
        line1: 'shipping_address_line1',
        line2: 'shipping_address_line2',
        city: 'shipping_city',
        state: 'shipping_state',
        postal_code: 'shipping_postal_code',
        country: 'shipping_country',
        phone: 'shipping_phone'
    };

    Object.entries(metadataFields).forEach(([field, key]) => {
        if (shipping[field]) {
            metadata[key] = shipping[field];
        }
    });

    const line_items = cart.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                description: `Size ${item.size}`
            },
            unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
    }));

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (totalAmount > 0) {
        line_items.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Shipping',
                    description: 'Flat rate shipping'
                },
                unit_amount: 500 // $5.00
            },
            quantity: 1
        });
    }

    try {
        const origin = req.headers['x-forwarded-proto'] ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host'] || req.headers.host}` : domain;
        const checkoutDomain = process.env.DOMAIN || origin;
        const successUrl = `${checkoutDomain}/success.html`;
        const cancelUrl = `${checkoutDomain}/cancel.html`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            metadata,
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: shipping.email,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'AU']
            }
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

app.get('/cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'cancel.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on ${domain}`);
});
