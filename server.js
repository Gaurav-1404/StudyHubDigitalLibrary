const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Database Setup ---
const db = new sqlite3.Database('./library.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the library database.');
});

db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    aadhar TEXT NOT NULL,
    address TEXT,
    mobile TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    monthsPaid INTEGER NOT NULL
)`);

// --- API Routes ---

// Serve Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/students', (req, res) => {
    const sql = "SELECT * FROM students ORDER BY name";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/students', (req, res) => {
    // The incoming data from the frontend is in req.body
    const { name, aadhar, address, mobile, startDate, endDate, monthsPaid } = req.body;
    
    // The SQL query expects 7 values
    const sql = `INSERT INTO students (name, aadhar, address, mobile, startDate, endDate, monthsPaid) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    // The 'params' array should also have 7 values
    const params = [name, aadhar, address, mobile, startDate, endDate, monthsPaid];

    db.run(sql, params, function(err) {
        if (err) {
            // THIS IS THE LINE WE ADDED FOR DEBUGGING
            // It will print the detailed error to your CMD/terminal window.
            console.error("DATABASE ERROR:", err.message); 
            
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({ "message": "success", "id": this.lastID });
    });
});

app.put('/students/:id/renew', (req, res) => {
    const { monthsToRenew } = req.body;
    const studentId = req.params.id;

    if (!monthsToRenew || monthsToRenew < 1) {
        return res.status(400).json({ "error": "Invalid number of months." });
    }

    const getSql = "SELECT endDate, monthsPaid FROM students WHERE id = ?";
    db.get(getSql, [studentId], (err, row) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        if (!row) {
            return res.status(404).json({ "error": "Student not found." });
        }

        const currentEndDate = new Date(row.endDate);
        currentEndDate.setMonth(currentEndDate.getMonth() + parseInt(monthsToRenew, 10));
        const newEndDate = currentEndDate.toISOString().split('T')[0];
        
        const newTotalMonthsPaid = row.monthsPaid + parseInt(monthsToRenew, 10);

        const updateSql = `UPDATE students SET endDate = ?, monthsPaid = ? WHERE id = ?`;
        db.run(updateSql, [newEndDate, newTotalMonthsPaid, studentId], function(err) {
            if (err) {
                return res.status(400).json({ "error": err.message });
            }
            res.json({
                message: `Successfully renewed student ${studentId}`,
                changes: this.changes,
            });
        });
    });
});

app.delete('/students/:id', (req, res) => {
    const sql = 'DELETE FROM students WHERE id = ?';
    db.run(sql, req.params.id, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": `deleted student ${req.params.id}` });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
