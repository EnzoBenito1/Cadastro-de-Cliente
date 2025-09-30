const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./clientes.db', (err) => {
  if (err) console.error(err.message);
  console.log('Conectado ao banco de dados SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/api/clientes', (req, res) => {
  db.all('SELECT * FROM clientes ORDER BY data_cadastro DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ clientes: rows });
  });
});

app.get('/api/clientes/:id', (req, res) => {
  db.get('SELECT * FROM clientes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }
    res.json({ cliente: row });
  });
});

app.post('/api/clientes', (req, res) => {
  const { nome, email, telefone, cpf } = req.body;
  
  if (!nome || !email || !telefone || !cpf) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    return;
  }

  const sql = 'INSERT INTO clientes (nome, email, telefone, cpf) VALUES (?, ?, ?, ?)';
  db.run(sql, [nome, email, telefone, cpf], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Email ou CPF já cadastrado' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.status(201).json({ 
      id: this.lastID,
      message: 'Cliente cadastrado com sucesso' 
    });
  });
});

app.put('/api/clientes/:id', (req, res) => {
  const { nome, email, telefone, cpf } = req.body;
  const sql = 'UPDATE clientes SET nome = ?, email = ?, telefone = ?, cpf = ? WHERE id = ?';
  
  db.run(sql, [nome, email, telefone, cpf, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }
    res.json({ message: 'Cliente atualizado com sucesso' });
  });
});

app.delete('/api/clientes/:id', (req, res) => {
  db.run('DELETE FROM clientes WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }
    res.json({ message: 'Cliente removido com sucesso' });
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = { app, db };