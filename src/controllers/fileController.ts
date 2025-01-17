import { __basedir } from '..';
import { BadRequestError } from '../middleware/errorMiddleware';
import uploadFileMiddleware from '../middleware/upload';
import Account from '../models/account';
import Profile from '../models/profile';
import { getAccountImage, getProfileImage } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

export const uploadAccountImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`POST /api/upload/accounts/${id}`, req.body);
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const accountImage = req.file.filename;
      const account = await Account.findById(Number(id));
      if (account) {
        const updatedAccount = await account.updateAccountImage(accountImage);
        if (updatedAccount) {
          res.status(200).send({
            message: `Uploaded the file successfully: ${accountImage}`,
            result: {
              id: account.account_id,
              name: account.account_name,
              email: account.email,
              image: getAccountImage(updatedAccount),
              default_profile_id: account.default_profile_id,
            },
          });
          const filePath = __basedir + '/uploads/accounts/' + account.image;
          fs.unlink(filePath, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                console.log('File not found');
              } else {
                console.error(err);
              }
            }
          });
        } else {
          throw new BadRequestError('Failed to add/update an account image');
        }
      } else {
        throw new BadRequestError('Failed to add/update an account image');
      }
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file?.originalname}. ${err}`,
    });
  }
});

export const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`POST /api/upload/profiles/${id}`, req.body);
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const profileImage = req.file.filename;
      const profile = await Profile.findById(Number(id));
      if (profile) {
        const updatedProfile = await profile.updateProfileImage(profileImage);
        if (updatedProfile) {
          res.status(200).send({
            message: `Uploaded the file successfully: ${profileImage}`,
            result: {
              id: updatedProfile.id,
              name: updatedProfile.name,
              image: getProfileImage(updatedProfile),
            },
          });
          const filePath = __basedir + '/uploads/profiles/' + profile.image;
          fs.unlink(filePath, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                console.log('File not found');
              } else {
                console.error(err);
              }
            }
          });
        } else {
          throw new BadRequestError('Failed to add/update a profile image');
        }
      } else {
        throw new BadRequestError('Failed to add/update a profile image');
      }
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file?.originalname}. ${err}`,
    });
  }
});
