import { sampleAccount } from '../mock_data/mock_account';
import { Request, Response } from 'express';

let autoId: number = 100;

export const registerUser = (req: Request, res: Response) => {
  console.log('POST /api/account', req.body);
  res.json(
    JSON.stringify({
      id: `${autoId++}`,
      name: req.body.name,
      email: req.body.email,
      image: 'https://placehold.co/300x200/orange/white?text=Family&font=roboto',
    }),
  );
};

export const authenticateUser = (req: Request, res: Response) => {
  console.log(`POST /api/login`, req.body);
  res.json(sampleAccount);
};

export const logoutUser = (req: Request, res: Response) => {
  console.log(`POST /api/logout`, req.body);
  res.send('logged out');
};
