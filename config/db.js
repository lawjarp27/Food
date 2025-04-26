const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'newl',
    password: '12345', // Change this to your PostgreSQL password
    port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
}; 