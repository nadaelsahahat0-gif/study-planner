const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// ======================
// MIDDLEWARE
// ======================

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// ======================
// MYSQL CONNECTION
// ======================

const db = mysql.createConnection({

   host: "localhost",

    user: "root",

    password: "1234",

   database: "study_planner"});

db.connect((err) => {

    if (err) {

        console.log(err);

   }

    else {

       console.log("MYSQL CONNECTED");

    }

});

// ======================
// HOME ROUTE
// ======================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});

// ======================
// REGISTER API
// ======================

app.post("/register", (req, res) => {

    const {
        name,
        email,
        password,
        phone
    } = req.body;

    if (!name || !email || !password || !phone) {

        return res.status(400).json({
            message: "All fields are required"
        });

    }

    const checkSql =
    "SELECT * FROM users WHERE email = ?";

    db.query(checkSql,
    [email],
    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Database Error"
            });

        }

        if (result.length > 0) {

            return res.status(400).json({
                message: "Email already exists"
            });

        }

        const sql =
        "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)";

        db.query(sql,
        [name, email, password, phone],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Register Failed"
                });

            }

            res.status(201).json({
                message: "User Registered Successfully"
            });

        });

    });

});

// ======================
// LOGIN API
// ======================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message: "Email and Password Required"
        });

    }

    const sql =
    "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql,
    [email, password],
    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Server Error"
            });

        }

        if (result.length === 0) {

            return res.status(401).json({
                message: "Invalid Email or Password"
            });

        }

        res.json({

            message: "Login Successful",

            user_id: result[0].id

        });

    });

});

// ======================
// GET USER PROFILE
// ======================

app.get("/user/:id", (req, res) => {

    const userId =
    req.params.id;

    const sql =
    "SELECT * FROM users WHERE id = ?";

    db.query(sql,
    [userId],
    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Database Error"
            });

        }

        if (result.length === 0) {

            return res.status(404).json({
                message: "User Not Found"
            });

        }

        res.json(result[0]);

    });

});

// ======================
// UPDATE PROFILE
// ======================

app.put("/update-user/:id", (req, res) => {

    const userId =
    req.params.id;

    const {
        name,
        email,
        phone
    } = req.body;

    const sql = `

        UPDATE users

        SET
        name = ?,
        email = ?,
        phone = ?

        WHERE id = ?

    `;

    db.query(sql,

    [name, email, phone, userId],

    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Update Failed"
            });

        }

        res.json({
            message: "Profile Updated Successfully"
        });

    });

});

// ======================
// ADD COURSE
// ======================

app.post("/add-course", (req, res) => {

    const {
        user_id,
        course_name,
        difficulty
    } = req.body;

    const sql = `

        INSERT INTO courses
        (user_id, course_name, difficulty)

        VALUES (?, ?, ?)

    `;

    db.query(sql,

    [user_id, course_name, difficulty],

    (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Failed To Add Course"
            });

        }

        res.json({
            message: "Course Added Successfully"
        });

    });

});

// ======================
// GET COURSES
// ======================

app.get("/courses/:user_id", (req, res) => {

    const sql =
    "SELECT * FROM courses WHERE user_id = ?";

    db.query(sql,

    [req.params.user_id],

    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Error"
            });

        }

        res.json(result);

    });

});

// ======================
// ADD EXAM
// ======================

app.post("/add-exam", (req, res) => {

    const {
        user_id,
        subject,
        exam_date
    } = req.body;

    const sql = `

        INSERT INTO exams
        (user_id, subject, exam_date)

        VALUES (?, ?, ?)

    `;

    db.query(sql,

    [user_id, subject, exam_date],

    (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Failed To Add Exam"
            });

        }

        res.json({
            message: "Exam Added Successfully"
        });

    });

});

// ======================
// GET EXAMS
// ======================

app.get("/exams/:user_id", (req, res) => {

    const sql =
    "SELECT * FROM exams WHERE user_id = ?";

    db.query(sql,

    [req.params.user_id],

    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Error"
            });

        }

        res.json(result);

    });

});

// ======================
// ADD TASK
// ======================

app.post("/add-task", (req, res) => {

    const {
        user_id,
        task_name,
        task_date
    } = req.body;

    const sql = `

        INSERT INTO tasks
        (user_id, task_name, task_date)

        VALUES (?, ?, ?)

    `;

    db.query(sql,

    [user_id, task_name, task_date],

    (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Failed To Add Task"
            });

        }

        res.json({
            message: "Task Added Successfully"
        });

    });

});

// ======================
// GET TASKS
// ======================

app.get("/tasks/:user_id", (req, res) => {

    const sql =
    "SELECT * FROM tasks WHERE user_id = ?";

    db.query(sql,

    [req.params.user_id],

    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Error"
            });

        }

        res.json(result);

    });

});

// ======================
// GENERATE STUDY PLAN
// ======================

// ======================
// GENERATE STUDY PLAN
// ======================

app.post("/generate-plan", (req, res) => {

    const { user_id } = req.body;

    // EXAMS
    const examsSql = `

        INSERT INTO study_plans
        (user_id, subject, study_hours, study_date)

        SELECT
        user_id,
        subject,
        3,
        exam_date

        FROM exams

        WHERE user_id = ?

    `;

    db.query(examsSql, [user_id], (err) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Failed To Generate Exams Plan"
            });

        }

        // TASKS
        const tasksSql = `

            INSERT INTO study_plans
            (user_id, subject, study_hours, study_date)

            SELECT
            user_id,
            task_name,
            1,
            task_date

            FROM tasks

            WHERE user_id = ?

        `;

        db.query(tasksSql, [user_id], (err) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Failed To Generate Tasks Plan"
                });

            }

            // COURSES
            const coursesSql = `

                INSERT INTO study_plans
                (user_id, subject, study_hours, study_date)

                SELECT
                user_id,
                course_name,
                CASE
                    WHEN difficulty = 'Hard' THEN 4
                    WHEN difficulty = 'Medium' THEN 3
                    ELSE 2
                END,
                CURDATE()

                FROM courses

                WHERE user_id = ?

            `;

            db.query(coursesSql, [user_id], (err) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        message: "Failed To Generate Courses Plan"
                    });

                }

                res.json({
                    message: "Study Plan Generated Successfully"
                });

            });

        });

    });

});
// ======================
// SHOW PLANS
// ======================

app.get("/plans/:user_id", (req, res) => {

    const sql =
    "SELECT * FROM study_plans WHERE user_id = ?";

    db.query(sql,

    [req.params.user_id],

    (err, result) => {

        if (err) {

            return res.status(500).json({
                message: "Error"
            });

        }

        res.json(result);

    });

});

// ======================
// DELETE EXAM
// ======================

app.delete("/delete-exam/:id", (req, res) => {

    const sql = "DELETE FROM exams WHERE id = ?";

    db.query(sql, [req.params.id], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Failed to delete exam" });
        }

        res.json({ message: "Exam deleted" });

    });

});

// ======================
// DELETE TASK
// ======================

app.delete("/delete-task/:id", (req, res) => {

    const sql = "DELETE FROM tasks WHERE id = ?";

    db.query(sql, [req.params.id], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Failed to delete task" });
        }

        res.json({ message: "Task deleted" });

    });

});

// ======================
// DELETE COURSE
// ======================

app.delete("/delete-course/:id", (req, res) => {

    const sql = "DELETE FROM courses WHERE id = ?";

    db.query(sql, [req.params.id], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Failed to delete course" });
        }

        res.json({ message: "Course deleted" });

    });

});

// ======================
// SERVER
// ======================

app.listen(5000, () => {

    console.log(
        "Server running on port 5000"
    );

});