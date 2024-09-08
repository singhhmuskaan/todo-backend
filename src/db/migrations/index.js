import {users_sql, tasks_sql, task_status_sql} from './sqls/index.js';
import {db} from "../index.js";

export const migrations = {
    runMigrations: () => {
        console.log('Running migrations');
        [users_sql, task_status_sql, tasks_sql].forEach(sql => {
            db.query(sql, (err, _result) => {
                if (err) {
                    console.error(err);
                }
            })
        });
    }
}