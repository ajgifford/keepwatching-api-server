import { httpLogger } from '../logger/logger';
import Account from '../models/account';
import { CacheService } from './cacheService';
import { errorService } from './errorService';

export interface GoogleLogin {
  message: string;
  account: Account;
}

/**
 * Service class for handling authentication business logic
 */
export class AuthenticationService {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  public async login(uid: string): Promise<Account> {
    const account = await Account.findByUID(uid);
    errorService.assertExists(account, 'Account', uid);
    httpLogger.info(`User logged in: ${account.email}`, { userId: account.uid });
    return account;
  }

  public async register(name: string, email: string, uid: string): Promise<Account> {
    const existingAccount = await Account.findByEmail(email);
    errorService.assertNotExists(existingAccount, 'Account', 'email', email);

    const account = new Account(name, email, uid);
    await account.register();
    return account;
  }

  public async googleLogin(name: string, email: string, uid: string): Promise<GoogleLogin> {
    const account = await Account.findByUID(uid);
    if (account) {
      httpLogger.info(`User logged in via Google: ${account.email}`, { userId: account.uid });
      return { message: 'Login successful', account };
    }
    const newAccount = new Account(name, email, uid);
    await newAccount.register();

    httpLogger.info(`New user registered via Google: ${email}`, { userId: uid });
    return { message: 'Account registered successfully', account: newAccount };
  }

  public async logout(accountId: string) {
    this.cache.invalidateAccount(accountId);
  }
}

export const authenticationService = new AuthenticationService();
