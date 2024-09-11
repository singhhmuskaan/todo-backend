import mysql from "mysql2";
import {migrations} from "./migrations/index.js";

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'junction.proxy.rlwy.net',
    port: '42606',
    user: 'root',
    password: 'DkgckxAUvTGlakNYCIKrjfjMueBlEcQJ',
    database: 'railway',
    multipleStatements: true,
});

// Connect to the MySQL database
db.connect();

// Run migrations after the database connection is established
migrations.runMigrations();

export {db};
