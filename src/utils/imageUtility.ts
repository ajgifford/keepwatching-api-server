import Account from '../models/account';

export function buildTMDBImagePath(path: string, size: string = 'w185'): string {
  return `http://image.tmdb.org/t/p/${size}/${path}`;
}

export function buildDefaultAccountImagePath(accountName: string): string {
  const formattedAccountName = replaceSpacesWithPlus(accountName);
  return `https://placehold.co/300x200/orange/white?text=${formattedAccountName}&font=roboto`;
}

function replaceSpacesWithPlus(input: string): string {
  return input.replace(/ /g, '+');
}

export function buildAccountImageName(id: string, mimetype: string) {
  const extArray = mimetype.split('/');
  const extension = extArray[extArray.length - 1];
  return `accountImage_${id}_${Date.now()}.${extension}`;
}

export function buildAccountImageURL(image: string) {
  return `http://localhost:${process.env.PORT}/uploads/${image}`;
}

export function getAccountImage(account: Account) {
  if (account.image) {
    return buildAccountImageURL(account.image);
  } else {
    return buildDefaultAccountImagePath(account.account_name);
  }
}
