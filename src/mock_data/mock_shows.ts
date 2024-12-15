export const sampleShows = JSON.stringify( [
    {
      id: "1",
      title: "Stranger Things",
      description: "A group of kids uncover mysteries in their small town.",
      release_date: "2016-07-15",
      genre: "Science Fiction",
      image: "https://via.placeholder.com/150",
      user_rating: 9,
      tv_parental_guidelines: "TV-14",
      number_of_seasons: 4,
      total_episodes: 34,
    },
    {
      id: "2",
      title: "Breaking Bad",
      description: "A chemistry teacher turned meth producer.",
      release_date: "2008-01-20",
      genre: "Drama",
      image: "https://via.placeholder.com/150",
      user_rating: 10,
      tv_parental_guidelines: "TV-MA",
      number_of_seasons: 5,
      total_episodes: 62,
    },
  ]);

export const sampleSeasons = JSON.stringify( [
  {
    id: "1",
    show_id: "1",
    title: "Season 1",
    number_of_episodes: 8,
  },
  {
    id: "2",
    show_id: "1",
    title: "Season 2",
    number_of_episodes: 9,
  },
  {
    id: "3",
    show_id: "2",
    title: "Season 1",
    number_of_episodes: 7,
  },
]);

export const sampleEpisodes = JSON.stringify( [
  {
    id: "1",
    season_id: "1",
    title: "The Vanishing of Will Byers",
    duration: 47,
    episode_number: 1,
  },
  {
    id: "2",
    season_id: "1",
    title: "The Weirdo on Maple Street",
    duration: 55,
    episode_number: 2,
  },
  {
    id: "3",
    season_id: "2",
    title: "Madmax",
    duration: 48,
    episode_number: 1,
  },
]);