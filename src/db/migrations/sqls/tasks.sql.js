export const tasks_sql = `CREATE TABLE IF NOT EXISTS \`tasks\` (
                         \`id\` int NOT NULL AUTO_INCREMENT,
                         \`title\` varchar(45) DEFAULT NULL,
                         \`description\` varchar(200) DEFAULT NULL,
                         \`status_id\` int DEFAULT NULL,
                         \`user_id\` int DEFAULT NULL,
                         \`created_at\` datetime DEFAULT NULL,
                         PRIMARY KEY (\`id\`),
                         KEY \`fk_tasks_1_idx\` (\`status_id\`),
                         KEY \`fk_tasks_2_idx\` (\`user_id\`),
                         CONSTRAINT \`fk_tasks_1\` FOREIGN KEY (\`status_id\`) REFERENCES \`task_status\` (\`id\`),
                         CONSTRAINT \`fk_tasks_2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
)`;