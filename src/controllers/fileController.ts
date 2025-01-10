import { __basedir } from '..';
import { BadRequestError } from '../middleware/errorMiddleware';
import uploadFileMiddleware from '../middleware/upload';
import Account from '../models/account';
import { getAccountImage } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`POST /api/upload/account/${id}`, req.body);
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const accountImage = req.file.filename;
      const account = await Account.findById(Number(id));
      if (account) {
        const updatedAccount = await account.updateProfileImage(accountImage);
        if (updatedAccount) {
          res.status(200).send({
            message: `Uploaded the file successfully: ${accountImage}`,
            result: {
              id: account.account_id,
              name: account.account_name,
              email: account.email,
              image: getAccountImage(updatedAccount),
            },
          });
          const filePath = __basedir + '/uploads/' + account.image;
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
