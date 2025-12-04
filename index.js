import express from "express";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } = process.env;

const app = express();
const port = 3333;

const database = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 10
});

app.use(cors());
app.use(express.json());

// ---------------------------------------------
app.get("/", (request, response) => {
    response.json({ message: "API funcionando!" }); // Corrigido para não usar 'persons'
});

// ---------------------------------------------
app.post("/cadastrar", (request, response) => {
    const { name, email, age, nickname, password } = request.body.user;

    const checkEmail = `SELECT * FROM inorga WHERE email = ?`;

    database.query(checkEmail, [email], (error, results) => {
        if (error) {
            console.log(error);
            return response.status(500).json({ error: "Erro no servidor." });
        }

        if (results.length > 0) {
            return response
                .status(400)
                .json({ message: "Este email já está cadastrado." });
        }

        const insertCommand = `
            INSERT INTO inorga(name, email, age, nickname, password)
            VALUES (?, ?, ?, ?, ?)
        `;

        database.query(
            insertCommand,
            [name, email, age, nickname, password],
            (error, results) => {
                if (error) {
                    console.log(error);
                    return response.status(500).json({ error: "Erro ao cadastrar usuário." });
                }

                response.status(201).json({
                    message: "Usuário cadastrado com sucesso!",
                    id: results.insertId
                });
            }
        );
    });
});

// ---------------------------------------------
app.post("/score", (req, res) => {
    const { id, score } = req.body;

    if (!id || score === undefined) {
        return res.status(400).json({ error: "ID e score são obrigatórios." });
    }

    const updateScore = `
        UPDATE inorga
        SET score = ?
        WHERE id = ?
    `;

    database.query(updateScore, [score, id], (error) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Erro ao atualizar score." });
        }

        return res.status(200).json({ message: "Score atualizado!" });
    });
});

// ---------------------------------------------
app.get("/ranking", (req, res) => {
    const rankingQuery = `
        SELECT id, name, nickname, score
        FROM inorga
        ORDER BY score DESC
    `;

    database.query(rankingQuery, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Erro ao buscar ranking." });
        }

        return res.json(results);
    });
});

// ---------------------------------------------
// login
app.post("/login", (request, response) => {
    const { email, password } = request.body.user;

    const selectCommand = "SELECT * from inorga WHERE email = ?";

    database.query(selectCommand, [email], (error, user) => {
        if (error) {
            console.log(error);
            return response.status(500).json({ error: "Erro no servidor." });
        }

        if (user.length === 0 || user[0].password !== password) {
            return response.status(400).json({ message: "Usuário ou senha incorreto" });
        }

        response.json({
            id: user[0].id,
            name: user[0].name
        });
    });
});

// ---------------------------------------------
app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}!`);
});
