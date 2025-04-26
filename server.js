const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./config/db');
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gaultiermorningstar@gmail.com",
        pass: "vkpKcxrrbufkuden",
    },
});


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Routes
app.get('/', async (req, res) => {
    if (req.session.user) {
        res.render('home', { user: req.session.user });
    } else {
        res.redirect('/login');
    }
    // res.render('home',{ })
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
});

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Check if email already exists
        const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkResult.rows.length > 0) {
            res.render('register', { error: 'Email already registered' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        const newUser = result.rows[0];
        req.session.user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'An error occurred during registration' });
    }
});

// NGO Registration routes
app.get('/register-ngo', (req, res) => {
    res.render('register-ngo', { error: null });
});

app.post('/register-ngo', async (req, res) => {
    const { ngo_name, email, pincode } = req.body;

    try {
        // Check if email already exists
        const checkResult = await db.query('SELECT * FROM ngos WHERE email = $1', [email]);
        if (checkResult.rows.length > 0) {
            res.render('register-ngo', { error: 'Email already registered' });
            return;
        }

        // Insert new NGO
        const result = await db.query(
            'INSERT INTO ngos (ngo_name, email, pincode) VALUES ($1, $2, $3) RETURNING id, ngo_name, email',
            [ngo_name, email, pincode]
        );

        // Redirect to home with success message
        res.redirect('/?success=ngo_registered');
    } catch (error) {
        console.error('NGO Registration error:', error);
        res.render('register-ngo', { error: 'An error occurred during registration' });
    }
});

// Donation routes
app.get('/donate', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }
    res.render('donate');
});

app.post('/donate', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }

    const { item_name, food_quality, quantity, description, address, pincode } = req.body;

    try {
        await db.query(
            'INSERT INTO food_donations (user_id, item_name, food_quality, quantity, description, address, pincode) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [req.session.user.id, item_name, food_quality, quantity, description, address, pincode]
        );
        res.redirect('/');
    } catch (error) {
        console.error('Donation error:', error);
        res.render('donate', { error: 'An error occurred while submitting your donation' });
    }
});

// View donations route
app.get('/donations', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }
    try {
        const donationsResult = await db.query(
            'SELECT * FROM food_donations WHERE user_id = $1 ORDER BY donation_date DESC',
            [req.session.user.id]
        );
        
        const donations = donationsResult.rows;
        for (let donation of donations) {
            const nearbyNgos = await db.query(
                'SELECT * FROM ngos WHERE ABS(CAST(pincode AS INTEGER) - CAST($1 AS INTEGER)) <= 50 ORDER BY ABS(CAST(pincode AS INTEGER) - CAST($1 AS INTEGER))',
                [donation.pincode]
            );
            donation.nearbyNgos = nearbyNgos.rows;
        }
        
        res.render('donations', { donations: donations });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.render('donations', { donations: [], error: 'Error fetching donations' });
    }
});

app.post("/send-email", async (req, res) => {
    const { email, donation_id, ngo_id } = req.body;
    
    try {
        const info = await transporter.sendMail({
            from: '"Food Share Project" <gaultiermorningstar@gmail.com>',
            to: email,
            subject: "Do you want to accept this food delivery?",
            html: `
                <p>Do you want to accept this food delivery?</p>
                <p>
                    <a href="http://localhost:3000/respond?answer=yes&donation_id=${donation_id}&ngo_id=${ngo_id}">✅ Yes</a> |
                    <a href="http://localhost:3000/respond?answer=no&donation_id=${donation_id}&ngo_id=${ngo_id}">❌ No</a>
                </p>
            `,
        });

        console.log("✅ Email sent:", info.messageId);
        res.render('thankyou');
    } catch (error) {
        console.error("❌ Email error:", error);
        res.render('thankyou', { error: "Email failed to send. Please try again." });
    }
});

app.get("/respond", async (req, res) => {
    const { answer, donation_id, ngo_id } = req.query;
    
    try {
        if (answer === 'yes') {
            // Update the donation with the NGO's response
            await db.query(
                'UPDATE food_donations SET ngo_response = $1, ngo_id = $2 WHERE id = $3',
                ['accepted', ngo_id, donation_id]
            );
            res.send(`
                <h1>Thanks! You accepted the donation 🙌</h1>
                <p>You can close this window now.</p>
            `);
        } else {
            res.send(`
                <h1>Thanks for your response!</h1>
                <p>You can close this window now.</p>
            `);
        }
    } catch (error) {
        console.error("Error updating donation status:", error);
        res.send("An error occurred while processing your response.");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
