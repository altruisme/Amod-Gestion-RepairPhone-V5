const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// ============ FICHES (Repair Cards) ============

// Get all fiches
app.get('/api/fiches', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fiches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single fiche
app.get('/api/fiches/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fiches')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create fiche
app.post('/api/fiches', async (req, res) => {
  try {
    const code = 'AM-' + Date.now().toString().slice(-6);
    const { data, error } = await supabase
      .from('fiches')
      .insert({ ...req.body, code })
      .select()
      .single();

    if (error) throw error;

    // If there's an advance payment, create a finance entry
    if (req.body.paye && parseFloat(req.body.paye) > 0) {
      await supabase
        .from('finances')
        .insert({
          type: 'Entrée',
          subtype: 'Entrée',
          montant: parseFloat(req.body.paye),
          motif: 'AVANCE ' + code,
          nom: req.body.nom
        });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update fiche
app.put('/api/fiches/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fiches')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete fiche
app.delete('/api/fiches/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('fiches')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FINANCES ============

// Get all finances
app.get('/api/finances', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create finance entry
app.post('/api/finances', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('finances')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update finance entry
app.put('/api/finances/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('finances')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete finance entry
app.delete('/api/finances/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('finances')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONFIG ============

// Get config
app.get('/api/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update config
app.put('/api/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('config')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ EXPORT / IMPORT ============

// Export all data
app.get('/api/export', async (req, res) => {
  try {
    const [fiches, finances, config] = await Promise.all([
      supabase.from('fiches').select('*'),
      supabase.from('finances').select('*'),
      supabase.from('config').select('*').maybeSingle()
    ]);

    res.json({
      fiches: fiches.data,
      finances: finances.data,
      config: config.data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import data
app.post('/api/import', async (req, res) => {
  try {
    const { fiches, finances, config } = req.body;

    // Clear existing data
    await supabase.from('fiches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('finances').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new data
    if (fiches && fiches.length > 0) {
      await supabase.from('fiches').insert(fiches);
    }
    if (finances && finances.length > 0) {
      await supabase.from('finances').insert(finances);
    }
    if (config) {
      await supabase.from('config').update(config).eq('id', '00000000-0000-0000-0000-000000000001');
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AUTOCOMPLETE ============

app.get('/api/autocomplete/clients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fiches')
      .select('nom, tel, gmail');

    if (error) throw error;

    const unique = {
      noms: [...new Set(data.map(f => f.nom).filter(Boolean))].sort(),
      tels: [...new Set(data.map(f => f.tel).filter(Boolean))].sort(),
      gmails: [...new Set(data.map(f => f.gmail).filter(Boolean))].sort(),
      models: [...new Set(data.map(f => f.model).filter(Boolean))].sort()
    };
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`A.MO.D Gestion server running on port ${PORT}`);
});
