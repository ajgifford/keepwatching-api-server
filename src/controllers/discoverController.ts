import { axiosStreamingAPIInstance } from '../utils/axiosInstance';
import { Request, Response } from 'express';

// GET /api/discover/top
export const discoverTopShows = async (req: Request, res: Response) => {
  const showType = req.query.showType as string;
  const service = req.query.service as string;
  const config = {
    params: {
      country: 'us',
      show_type: `${showType}`,
      service: `${service}`,
    },
  };
  try {
    const response = await axiosStreamingAPIInstance.get('/shows/top', config);
    const results: any[] = response.data;
    const searchResult = results.map((result) => {
      return {
        id: stripPrefix(result.tmdbId),
        title: result.title,
        genres: result.genres.map((genre: { name: any }) => genre.name),
        premiered: getPremieredDate(showType, result),
        summary: result.overview,
        image: result.imageSet.verticalPoster.w240,
        rating: result.rating,
      };
    });
    res.status(200).json({ message: `Found top ${showType} for ${service}`, results: searchResult });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while discovering top content', error: error });
  }
};

function stripPrefix(input: string): string {
  return input.replace(/^(tv\/|movie\/)/, '');
}

function getPremieredDate(searchType: string, result: { firstAirYear?: any; releaseYear?: any }) {
  if (searchType === 'movie') {
    return result.releaseYear;
  } else {
    return result.firstAirYear;
  }
}
