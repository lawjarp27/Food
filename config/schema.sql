-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create food_donations table
CREATE TABLE IF NOT EXISTS food_donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    item_name VARCHAR(100) NOT NULL,
    food_quality VARCHAR(50) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    donation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create NGOs table
CREATE TABLE IF NOT EXISTS ngos (
    id SERIAL PRIMARY KEY,
    ngo_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 