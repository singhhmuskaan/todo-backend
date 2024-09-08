import mysql from "mysql2";
import {migrations} from "./migrations/index.js";

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'test',
    multipleStatements: true,
});

// Connect to the MySQL database
db.connect();

// Run migrations after the database connection is established
migrations.runMigrations();

export {db};
