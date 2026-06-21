import express from 'express';
import cors from 'cors';
import bedsRouter from './routes/beds.js';
import ordersRouter from './routes/orders.js';
import recordsRouter from './routes/records.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/beds', bedsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/records', recordsRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
