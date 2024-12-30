import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { createImagePath } from '../utils/imageUtility';
import { Request, Response } from 'express';

const tvGenreIdToGenreMap: Map<number, string> = new Map();

tvGenreIdToGenreMap.set(10759, 'Action & Adventure');
tvGenreIdToGenreMap.set(16, 'Animation');
tvGenreIdToGenreMap.set(35, 'Comedy');
tvGenreIdToGenreMap.set(80, 'Crime');
tvGenreIdToGenreMap.set(99, 'Documentary');
tvGenreIdToGenreMap.set(18, 'Drama');
tvGenreIdToGenreMap.set(10751, 'Family');
tvGenreIdToGenreMap.set(10762, 'Kids');
tvGenreIdToGenreMap.set(9648, 'Mystery');
tvGenreIdToGenreMap.set(10763, 'News');
tvGenreIdToGenreMap.set(10764, 'Reality');
tvGenreIdToGenreMap.set(10765, 'Sci-Fi & Fantasy');
tvGenreIdToGenreMap.set(10766, 'Soap');
tvGenreIdToGenreMap.set(10767, 'Talk');
tvGenreIdToGenreMap.set(10768, 'War & Politics');
tvGenreIdToGenreMap.set(37, 'Western');

export const searchShow = async (req: Request, res: Response) => {
  const searchString = req.query.searchString;
  console.log(`GET /api/search/show`, req.query);

  const response = await axiosTMDBAPIInstance.get(`/search/tv?query=${searchString}&include_adult=true`);
  const results: any[] = response.data.results;
  const searchResult = results.map((result) => {
    return {
      id: result.id,
      title: result.name,
      genres: generateTVGenreArray(result.genre_ids),
      premiered: result.first_air_date,
      summary: result.overview,
      image: createImagePath(result.poster_path),
      rating: result.vote_average,
    };
  });

  res.status(200).json(searchResult);
  //&append_to_response=release_dates
};

function generateTVGenreArray(genreIds: number[]): string[] {
  let genres: string[] = [];
  genreIds.map((id) => {
    genres.push(tvGenreIdToGenreMap.get(id)!);
  });
  return genres;
}
