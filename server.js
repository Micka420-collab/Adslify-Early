require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Webhook endpoint (Doit utiliser express.raw avant express.json)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (endpointSecret) {
      // Signature de sécurité (recommandée)
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Bypass sans sécurité locale (si pas de secret configuré)
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter les événements demandés
  switch (event.type) {
    case 'setup_intent.created':
      const setupIntent = event.data.object;
      console.log('✅ Setup Intent créé ! Prêt à enregistrer la méthode de paiement :', setupIntent.id);
      // TODO: Lier l'ID client dans ta base de données (Supabase par exemple)
      break;

    case 'v1.billing.meter.error_report_triggered':
      const meterError = event.data.object;
      console.error('🚨 Erreur de facturation (Meter) détectée :', meterError);
      // TODO: Envoyer un email à l'administrateur ou couper l'accès API
      break;

    default:
      console.log(`ℹ️ Événement non pris en charge spécifiquement : ${event.type}`);
  }

  // Stripe s'attend à un 200 OK
  res.status(200).send();
});

// Parsers classiques pour le reste de l'API
app.use(express.json());

// Plans and their Prices configurations from Dashboard Stripe
const PLAns_PRICES = {
  'Explorer': process.env.STRIPE_PRICE_EXPLORER,
  'Pioneer': process.env.STRIPE_PRICE_PIONEER,
  'Builder': process.env.STRIPE_PRICE_BUILDER
};

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { plan, email } = req.body;
    const priceId = PLAns_PRICES[plan];

    if (!priceId) {
      return res.status(400).json({ error: 'Plan non reconnu ou Price ID manquant.'});
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email, // Pré-remplir l'email
      success_url: `${req.headers.origin}/?success=true&plan=${plan}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: 'Une erreur interne a bloqué la création de la session Stripe.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur Adslify démarré sur http://localhost:${PORT}`);
});
