require('dotenv').config();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        const domain = process.env.DOMAIN || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url: `${domain}/success.html`,
            cancel_url: `${domain}/cancel.html`
        });

        return res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe error:', error);
        return res.status(500).json({ error: error.message });
    }
}
