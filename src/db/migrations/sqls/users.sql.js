export const users_sql = `CREATE TABLE IF NOT EXISTS users (
                       \`id\` int NOT NULL AUTO_INCREMENT,
                       \`name\` varchar(45) DEFAULT NULL,
                       \`email\` varchar(45) DEFAULT NULL,
                       \`password\` varchar(200) DEFAULT NULL,
                       \`google_token\` text,
                       PRIMARY KEY (\`id\`)
);`;