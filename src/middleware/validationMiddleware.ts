import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

export const validateEmail = [body('email').isEmail().withMessage('Invalid email format')];

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

export const validatePassword = [
  body('password')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Password can not be empty!')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Minimum 8 characters required!'),
];
