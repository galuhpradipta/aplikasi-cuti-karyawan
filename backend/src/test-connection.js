import db from './config/db.js';

async function testConnection() {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('Database connection test successful');
    } catch (error) {
        console.error('Database connection test failed:', error);
    } finally {
        process.exit();
    }
}

testConnection(); 