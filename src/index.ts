import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("KeepWatching API");
});

app.get('/api/shows', (req, res) => {
  res.json({ shows: [{
    id: "1",
    title: "Stranger Things",
    description: "A group of kids uncover mysteries in their small town.",
    release_date: "2016-07-15",
    genre: "Science Fiction",
    image: "https://via.placeholder.com/150",
  },
  {
    id: "2",
    title: "Breaking Bad",
    description: "A chemistry teacher turned meth producer.",
    release_date: "2008-01-20",
    genre: "Drama",
    image: "https://via.placeholder.com/150",
  },
  {
    id: "3",
    title: "NCIS",
    description: "A look at the lives of Navy Cops.",
    release_date: "2004-01-20",
    genre: "Drama",
    image: "https://via.placeholder.com/150",
  }]});
});

app.get('/api/movies', (req, res) => {
  res.json({ movies: [
    {
      id: "1",
      title: "Inception",
      description: "A thief who steals secrets through dreams.",
      release_date: "2010-07-16",
      genre: "Science Fiction",
      duration: 148,
      image: "https://via.placeholder.com/150",
    },
    {
      id: "2",
      title: "The Dark Knight",
      description: "Batman faces the Joker in Gotham City.",
      release_date: "2008-07-18",
      genre: "Action",
      duration: 152,
      image: "https://via.placeholder.com/150",
    },
  ]});
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