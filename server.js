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
    if (cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

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

    try {
        const origin = req.headers['x-forwarded-proto'] ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host'] || req.headers.host}` : domain;
        const checkoutDomain = process.env.DOMAIN || origin;
        const successUrl = `${checkoutDomain}/success.html`;
        const cancelUrl = `${checkoutDomain}/cancel.html`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url: successUrl,
            cancel_url: cancelUrl
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
