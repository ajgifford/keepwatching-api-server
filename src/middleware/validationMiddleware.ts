import { body } from 'express-validator';

export const validateEmail = [body('email').isEmail().withMessage('Invalid email format')];

export const validateUID = [body('uid').trim().escape().not().isEmpty().withMessage('uid can not be empty!').bail()];

export const validateName = [
  body('name')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Name can not be empty!')
    .bail()
    .isLength({ min: 3 })
    .withMessage('Minimum 3 characters required!'),
];
