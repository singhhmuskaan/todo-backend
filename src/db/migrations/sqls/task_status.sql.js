export const task_status_sql = `CREATE TABLE IF NOT EXISTS \`task_status\` (
                          \`id\` int NOT NULL,
                          \`name\` varchar(45) DEFAULT NULL,
                          PRIMARY KEY (\`id\`)
);
INSERT IGNORE INTO task_status (id, name) VALUES (1, 'TODO');
INSERT IGNORE INTO task_status (id, name) VALUES (2, 'INPROGRESS');
INSERT IGNORE INTO task_status (id, name) VALUES (3, 'DONE');
`;