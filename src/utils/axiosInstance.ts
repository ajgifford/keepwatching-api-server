import axios from 'axios';

export const axiosStreamingAPIInstance = axios.create({
  baseURL: 'https://streaming-availability.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': `${process.env.STREAMING_API_KEY}`,
    'x-rapidapi-host': `${process.env.STREAMING_API_HOST}`,
  },
});

export const axiosTMDBAPIInstance = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
  },
});
