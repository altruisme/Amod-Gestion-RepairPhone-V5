const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Connexion Neon
const connectionString = "postgresql://neondb_owner:AmodGestion2026@ep-bold-sunset-asn43g37-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString: connectionString });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 1. Vérification de licence (pour la page login)
app.post('/api/verifier-licence', async (req, res) => {
    const { telephone } = req.body;
    try {
        const query = 'SELECT * FROM licences WHERE telephone_client = $1 AND est_actif = true AND date_expiration >= CURRENT_DATE';
        const result = await pool.query(query, [telephone]);
        
        if (result.rows.length > 0) {
            res.json({ acces: 'autorise' });
        } else {
            res.status(403).json({ acces: 'refuse', message: 'Licence invalide ou expirée.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 2. Routes API Réparations
app.get('/api/reparations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fiches_reparation ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reparations', async (req, res) => {
    const { client_name, client_phone, phone_model, phone_fault, montant_total, montant_paye, date_depot, garantie } = req.body;
    try {
        const query = `INSERT INTO fiches_reparation (client_name, client_phone, phone_model, phone_fault, montant_total, montant_paye, date_depot, garantie) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`;
        await pool.query(query, [client_name, client_phone, phone_model, phone_fault, montant_total, montant_paye, date_depot, garantie]);
        res.status(201).json({ message: "Réparation enregistrée" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Route par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Serveur A.MO.D démarré sur http://localhost:${port}`);
});