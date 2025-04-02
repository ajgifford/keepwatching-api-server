import Account from '../models/account';

export function buildTMDBImagePath(path: string, size: string = 'w185'): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function buildDefaultImagePath(accountName: string): string {
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

export function buildProfileImageName(id: string, mimetype: string) {
  const extArray = mimetype.split('/');
  const extension = extArray[extArray.length - 1];
  return `profileImage_${id}_${Date.now()}.${extension}`;
}

export function buildUploadedImageURL(image: string, folder: string) {
  return `${process.env.KW_HOST}/uploads/${folder}/${image}`;
}

export function getAccountImage(account: Account) {
  if (account.image) {
    return buildUploadedImageURL(account.image, 'accounts');
  }
  return buildDefaultImagePath(account.account_name);
}

export function getPhotoForGoogleAccount(name: string, photoURL: string | undefined, account: Account) {
  if (account.image) {
    return buildUploadedImageURL(account.image, 'accounts');
  }
  if (photoURL) {
    return photoURL;
  }
  return buildDefaultImagePath(name);
}

export function getProfileImage(image: string | undefined, name: string) {
  if (image) {
    return buildUploadedImageURL(image, 'profiles');
  }
  return buildDefaultImagePath(name);
}
