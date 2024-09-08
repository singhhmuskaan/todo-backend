const express = require('express');
const app = express();
const PORT = 8080;
const mysql = require('mysql');
const cors = require('cors');

// Use CORS middleware
app.use(cors());


// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'todo_db'
});

// Connect to the MySQL database
connection.connect();

app.use(express.json()); // Middleware to parse JSON

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'a_really_strong_and_secure_random_key_1234567890'; 


// app.post('/api/register', async (req, res) => {
//     const { name, email, password } = req.body;

//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);

//         const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
//         connection.query(query, [name, email, hashedPassword], (err, result) => {
//             if (err) {
//                 console.error('Error executing query:', err);
//                 return res.status(500).json({ error: 'Registration failed' });
//             }

//             res.status(201).json({ message: 'User registered successfully' });
//         });
//     } catch (err) {
//         console.error('Server error:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        connection.query(`SELECT * FROM users WHERE email = ?`, [email], async (error, results) => {
            if (error) return res.status(500).json({ error: 'Database query failed' });

            if (results.length > 0) {
                return res.status(400).json({ error: 'User already registered. Please log in.' });
            }

            // Hash password and insert new user
            const hashedPassword = await bcrypt.hash(password, 10);
            connection.query(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ error: 'Registration failed' });

                // Generate token
                const token = jwt.sign({ userId: result.insertId }, SECRET_KEY, { expiresIn: '1h' });

                res.status(201).json({ message: 'User registered successfully', token });
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
app.post('/api/google-signup', async (req, res) => {
    const { name, email, googleToken } = req.body;

    try {
        // Check if email already exists
        connection.query(`SELECT * FROM users WHERE email = ?`, [email], async (error, results) => {
            if (error) return res.status(500).json({ error: 'Database query failed' });

            if (results.length > 0) {
                return res.status(400).json({ error: 'User already registered. Please log in.' });
            }

            // Hash password and insert new user
            connection.query('INSERT INTO users (name, email, google_token) VALUES (?, ?, ?)', [name, email, googleToken], (err, result) => {
                if (err) {
                    console.error('Database insertion error:', err); // Log the error to the console
                    return res.status(500).json({ error: 'Registration failed' });
                }
            
                // Generate token
                const token = jwt.sign({ userId: result.insertId }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });
            
                res.status(201).json({ message: 'User registered successfully', token });
            });
            
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ?`;
    connection.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate a JWT with the user ID
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ token });
    });
});


app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.userId = user.userId; // Attach user ID from the decoded token
        next();
    });
});


app.post("/api/tasks", (req, res) => {
    const { title, description } = req.body;
    const userId = req.userId; // Extracted from the JWT in the middleware
    const status = 1;
    
    // SQL query to insert task along with the current timestamp
    const query = `INSERT INTO tasks (title, description, user_id, status, created_at) VALUES (?, ?, ?, ?, NOW())`;
    
    connection.query(query, [title, description, userId, status], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to create task' });

        // Send response with task ID
        res.status(201).json({ message: 'Task Created', taskId: result.insertId });
    });
});



// READ: Get all tasks for the logged-in user (GET)
app.get('/api/tasks', (req, res) => {
    const userId = req.userId; // Get the logged-in user's ID from request
    const query = "SELECT * FROM tasks WHERE user_id = ?"; // Assuming each task has a `user_id` field

    connection.query(query, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }

        res.json(results);
    });
});

// UPDATE: Edit a task (PUT)
app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;
    const userId = req.userId;

    const query = `UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?`;
    connection.query(query, [title, description, status, taskId, userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to update task' });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found or not authorized' });
        }

        res.status(200).json({ message: 'Task updated successfully' });
    });
});

// DELETE: Delete a task (DELETE)
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;

    const query = `DELETE FROM tasks WHERE id = ? AND user_id = ?`;
    connection.query(query, [taskId, userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to delete task' });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found or not authorized' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    });
});

// READ: Get details of a specific task (GET)
app.get('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;

    const query = `SELECT * FROM tasks WHERE id = ? AND user_id = ?`;
    connection.query(query, [taskId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });

        if (results.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(results[0]);
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
