import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("KeepWatching API");
});

app.get("/api/users", (req: Request, res: Response) => {
  res.send("KeepWatching Users");
});

app.put('/api/user', (req, res) => {
  res.send('Got a PUT request at /api/user')
})

app.delete('/api/user', (req, res) => {
  res.send('Got a DELETE request at /api/user')
})

app.patch('/api/user', (req, res) => {
  res.send('Got a PATCH request at /api/user')
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});