import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { UsageService } from '../src/service/usage.service';

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/api/usage/stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    if (days < 1 || days > 90) {
      return res.status(400).json({ error: 'Days must be between 1 and 90' });
    }

    const stats = await UsageService.getStats(1, days); // Захардкоженный ID для теста
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));