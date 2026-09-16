const express=require('express');
const cors=require('cors')
const helmet=require('helmet')
const morgan=require('morgan')
const path=require('path');
const { requireAuth } = require('./middleware/auth.middleware');
const app=express();
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors());app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.get(['/dashboard', '/products', '/sales', '/sales/history', '/purchases', '/expenses'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.get('/api/health', (q,s)=>s.json({status:'ok'}));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', requireAuth, require('./routes/product.routes'));
app.use('/api/purchases', requireAuth, require('./routes/purchase.routes'));
app.use('/api/sales', requireAuth, require('./routes/sale.routes'));
app.use('/api/expenses', requireAuth, require('./routes/expense.routes'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard.routes'));

module.exports=app;
