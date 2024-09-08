import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {db} from "./db/index.js";

const app = express();
const PORT = 8080;
// Use CORS middleware
app.use(cors());


app.use(express.json());
const SECRET_KEY = 'a_really_strong_and_secure_random_key_1234567890';


app.post('/api/register', async (req, res) => {
    const {name, email, password} = req.body;

    try {
        // Check if email already exists
        db.query(`SELECT *
                  FROM users
                  WHERE email = ?`, [email], async (error, results) => {
            if (error) return res.status(500).json({error: 'Database query failed'});

            if (results.length > 0) {
                return res.status(400).json({error: 'User already registered. Please log in.'});
            }

            // Hash password and insert new user
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query(`INSERT INTO users (name, email, password)
                      VALUES (?, ?, ?)`, [name, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({error: 'Registration failed'});

                // Generate token
                const token = generateToken(result);
                res.status(201).json({message: 'User registered successfully', token});
            });
        });
    } catch (err) {
        res.status(500).json({error: 'Server error'});
    }
});
app.post('/api/google-signup', async (req, res) => {
    const {name, email, googleToken} = req.body;

    try {
        // Check if email already exists
        db.query(`SELECT *
                  FROM users
                  WHERE email = ? limit 1`, [email], async (error, results) => {
            if (error) return res.status(500).json({error: 'Database query failed'});

            if (results.length > 0) {
                const user = results[0];
                const token = generateToken(user);
                res.status(201).json({message: 'User logged in successfully', token});
            } else {
                db.query('INSERT INTO users (name, email, google_token) VALUES (?, ?, ?)', [name, email, googleToken], (err, result) => {
                    if (err) {
                        console.error('Database insertion error:', err); // Log the error to the console
                        return res.status(500).json({error: 'Registration failed'});
                    }

                    // Generate token
                    const token = generateToken(result);
                    res.status(201).json({message: 'User registered successfully', token});
                });
            }

        });
    } catch (err) {
        res.status(500).json({error: 'Server error'});
    }
});

function generateToken(user) {
    return jwt.sign({userId: user.id}, SECRET_KEY, {expiresIn: '1h'});
}


app.post('/api/login', (req, res) => {
    const {email, password} = req.body;

    const query = `SELECT *
                   FROM users
                   WHERE email = ?`;
    db.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        // Generate a JWT with the user ID
        const token = generateToken(user);
        res.json({token});
    });
});


app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({error: 'Access denied. No token provided.'});

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({error: 'Invalid token'});
        req.userId = user.userId; // Attach user ID from the decoded token
        next();
    });
});


app.post("/api/tasks", (req, res) => {
    const {title, description} = req.body;
    const userId = req.userId; // Extracted from the JWT in the middleware
    const status_id = 1;

    // SQL query to insert task along with the current timestamp
    const query = `INSERT INTO tasks (title, description, user_id, status_id, created_at)
                   VALUES (?, ?, ?, ?, NOW())`;

    db.query(query, [title, description, userId, status_id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({error: 'Failed to create task'});
        }

        // Send response with task ID
        res.status(201).json({id: result.insertId, title, description, status_id});
    });
});


// READ: Get all tasks for the logged-in user (GET)
app.get('/api/tasks', (req, res) => {
    const userId = req.userId; // Get the logged-in user's ID from request
    const query = "SELECT * FROM tasks WHERE user_id = ?"; // Assuming each task has a `user_id` field

    db.query(query, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({error: 'Database query failed'});
        }

        res.json(results);
    });
});

// UPDATE: Edit a task (PUT)
app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const {title, description, status_id} = req.body;
    const userId = req.userId;

    const query = `UPDATE tasks
                   SET title       = ?,
                       description = ?,
                       status_id   = ?
                   WHERE id = ?
                     AND user_id = ?`;
    db.query(query, [title, description, status_id, taskId, userId], (err, result) => {
        if (err) return res.status(500).json({error: 'Failed to update task'});

        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Task not found or not authorized'});
        }

        res.status(200).json({id: parseInt(taskId), title, description, status_id});
    });
});

// DELETE: Delete a task (DELETE)
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;

    const query = `DELETE
                   FROM tasks
                   WHERE id = ?
                     AND user_id = ?`;
    db.query(query, [taskId, userId], (err, result) => {
        if (err) return res.status(500).json({error: 'Failed to delete task'});

        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Task not found or not authorized'});
        }

        res.status(200).json({message: 'Task deleted successfully'});
    });
});

// READ: Get details of a specific task (GET)
app.get('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;

    const query = `SELECT *
                   FROM tasks
                   WHERE id = ?
                     AND user_id = ?`;
    db.query(query, [taskId, userId], (err, results) => {
        if (err) return res.status(500).json({error: 'Database query failed'});

        if (results.length === 0) {
            return res.status(404).json({error: 'Task not found'});
        }

        res.json(results[0]);
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
