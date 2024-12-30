export function createImagePath(path: string, size: string = 'w185'): string {
  return `http://image.tmdb.org/t/p/${size}/${path}`;
}
