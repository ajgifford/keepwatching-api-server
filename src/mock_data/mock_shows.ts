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

export const sampleShow = JSON.stringify({
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
      streaming_service: "Netflix",
      seasons: [
        {
          id: 1,
          title: "Season 1",
          number_of_episodes: 3,
          release_date: "2022-01-01",
          image: "https://via.placeholder.com/150",
          episodes: [
            {
              id: 101,
              title: "Episode 1",
              episode_number: "101",
              release_date: "2022-01-01",
              duration: "42m",
              image: "https://via.placeholder.com/100",
              watched: false,
            },
            {
              id: 102,
              title: "Episode 2",
              episode_number: "102",
              release_date: "2022-01-08",
              duration: "45m",
              image: "https://via.placeholder.com/100",
              watched: false,
            },
            {
              id: 103,
              title: "Episode 3",
              episode_number: "103",
              release_date: "2022-01-15",
              duration: "40m",
              image: "https://via.placeholder.com/100",
              watched: false,
            },
          ],
        },
        {
          id: 2,
          title: "Season 2",
          number_of_episodes: 2,
          release_date: "2023-01-01",
          image: "https://via.placeholder.com/150",
          episodes: [
            {
              id: 201,
              title: "Episode 1",
              episode_number: "201",
              release_date: "2023-01-01",
              duration: "50m",
              image: "https://via.placeholder.com/100",
              watched: false,
            },
            {
              id: 202,
              title: "Episode 2",
              episode_number: "201",
              release_date: "2023-01-08",
              duration: "55m",
              image: "https://via.placeholder.com/100",
              watched: false,
            },
          ],
        },
      ]
      
});

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