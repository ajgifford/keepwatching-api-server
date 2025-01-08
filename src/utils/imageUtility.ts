export function buildTMDBImagePath(path: string, size: string = 'w185'): string {
  return `http://image.tmdb.org/t/p/${size}/${path}`;
}

export function buildAccountImagePath(accountName: string): string {
  const formattedAccountName = replaceSpacesWithPlus(accountName);
  return `https://placehold.co/300x200/orange/white?text=${formattedAccountName}&font=roboto`;
}

function replaceSpacesWithPlus(input: string): string {
  return input.replace(/ /g, '+');
}
