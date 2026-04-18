const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-key';

const allowedOrigins = [
];

app.use(cors());

app.use(express.json());

// Mocked in-memory data store for demo CRUD operations.
let items = [
  { id: 1, name: 'Laptop', category: 'Electronics' },
  { id: 2, name: 'Notebook', category: 'Stationery' },
  { id: 3, name: 'Coffee Mug', category: 'Kitchen' }
];
let nextId = 4;

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Mock authentication. Replace with DB/user-service validation in production.
  if (username === 'admin' && password === 'Admin@123') {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, {
      expiresIn: '1h'
    });

    return res.json({ token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// apply filter on name, category and id using query parameters
app.get('/api/items', authenticateToken, (req, res) => {
  const { name, category, id } = req.query;
  let filteredItems = items;

  if (id) {
    const parsedId = Number(id);
    if (!Number.isNaN(parsedId)) {
      filteredItems = filteredItems.filter((item) => item.id === parsedId);
    } else {
      filteredItems = [];
    }
  }

  if (name) {
    const normalizedName = String(name).trim().toLowerCase();
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(normalizedName)
    );
  }

  if (category) {
    const normalizedCategory = String(category).trim().toLowerCase();
    filteredItems = filteredItems.filter((item) =>
      item.category.toLowerCase().includes(normalizedCategory)
    );
  }

  res.json(filteredItems);
});

app.get('/api/items/:id', authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  return res.json(item);
});


// to create a new item
app.post('/api/items', authenticateToken, (req, res) => {
  const { name, category } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'name and category are required' });
  }

  const newItem = { id: nextId, name, category };
  nextId += 1;
  items.push(newItem);

  return res.status(201).json(newItem);
});

// update
app.put('/api/items/:id', authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { name, category } = req.body;
  const itemIndex = items.findIndex((entry) => entry.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  if (!name || !category) {
    return res.status(400).json({ message: 'name and category are required' });
  }

  //items[itemIndex] = { id, name, category };
  return res.json(items[itemIndex]);
});

// delete
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const itemIndex = items.findIndex((entry) => entry.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  const deleted = items[itemIndex];
  items.splice(itemIndex, 1);
  return res.json(deleted);
});

// add route for patch
app.patch('/api/items/:id', authenticateToken, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { name, category } = req.body;
  const itemIndex = items.findIndex((entry) => entry.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  if (name) {
    items[itemIndex].name = name;
  }

  if (category) {
    items[itemIndex].category = category;
  }

  return res.json(items[itemIndex]);
});


const projectPath = path.join(process.env.HOME, 'Desktop', 'angularTraining', 'dist', 'angularTraining', 'browser');

app.use(express.static(projectPath));

// Angular routing fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(projectPath, 'index.html'));
});

app.use((req, res, next) => {


  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
