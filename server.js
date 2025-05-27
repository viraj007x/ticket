const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite Database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      ticketId TEXT PRIMARY KEY,
      name TEXT,
      route TEXT,
      date TEXT,
      seat TEXT
    )`);
  }
});

// Mock payment validation function
function validatePaymentDetails(cardNumber, cardholderName, expiryDate, cvv, billingAddress) {
  // Basic validation rules (for demo purposes)
  const cardNumberRegex = /^\d{16}$/;
  const expiryDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const cvvRegex = /^\d{3}$/;

  if (!cardNumberRegex.test(cardNumber.replace(/\s/g, ''))) {
    return { valid: false, message: 'Invalid card number. Must be 16 digits.' };
  }
  if (!expiryDateRegex.test(expiryDate)) {
    return { valid: false, message: 'Invalid expiry date. Use MM/YY format.' };
  }
  if (!cvvRegex.test(cvv)) {
    return { valid: false, message: 'Invalid CVV. Must be 3 digits.' };
  }
  if (!cardholderName.trim()) {
    return { valid: false, message: 'Cardholder name is required.' };
  }
  if (!billingAddress.trim()) {
    return { valid: false, message: 'Billing address is required.' };
  }
  return { valid: true };
}

// API to process payment and save booking
app.post('/api/payment', (req, res) => {
  const { name, route, date, seat, cardNumber, cardholderName, expiryDate, cvv, billingAddress } = req.body;

  // Validate required booking fields
  if (!name || !route || !date || !seat) {
    return res.status(400).json({ error: 'All booking fields are required.' });
  }

  // Validate payment details
  const paymentValidation = validatePaymentDetails(cardNumber, cardholderName, expiryDate, cvv, billingAddress);
  if (!paymentValidation.valid) {
    return res.status(400).json({ error: paymentValidation.message });
  }

  // Generate ticket ID
  const ticketId = 'T' + Math.floor(1000 + Math.random() * 9000);

  // Save booking to database
  db.run(
    `INSERT INTO bookings (ticketId, name, route, date, seat) VALUES (?, ?, ?, ?, ?)`,
    [ticketId, name, route, date, seat],
    function (err) {
      if (err) {
        console.error('Error saving booking:', err.message);
        return res.status(500).json({ error: 'Failed to save booking.' });
      }
      res.json({ message: 'Booking confirmed!', ticketId });
    }
  );
});

// API to retrieve all bookings
app.get('/api/bookings', (req, res) => {
  db.all(`SELECT * FROM bookings`, [], (err, rows) => {
    if (err) {
      console.error('Error retrieving bookings:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve bookings.' });
    }
    res.json(rows);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});