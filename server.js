const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Variable temporaire pour stocker les réparations en ligne
let reparationsGlobales = [];

// Route pour envoyer la liste des réparations à un téléphone qui se connecte
app.get('/api/reparations', (req, res) => {
    res.json(reparationsGlobales);
});

// Route pour recevoir une nouvelle réparation depuis un téléphone
app.post('/api/reparations', (req, res) => {
    reparationsGlobales = req.body;
    res.json({ status: "success", message: "Données synchronisées" });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur Amis du Monde Divin actif avec synchronisation`);
});
