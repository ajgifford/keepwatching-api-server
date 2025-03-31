import { cliLogger, httpLogger } from '../logger/logger';
import { ForbiddenError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import { CacheService } from './cacheService';
import { errorService } from './errorService';

/**
 * Interface representing the response for a Google login operation,
 * which could be either a login to an existing account or creation of a new account
 */
export interface GoogleLoginResponse {
  account: Account;
  isNewAccount: boolean;
}

/**
 * Service class for handling authentication business logic
 */
export class AuthenticationService {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  /**
   * Authenticates a user by their UID
   *
   * @param uid - Firebase user ID
   * @returns The authenticated account
   * @throws {NotFoundError} If no account exists with the provided UID
   */
  public async login(uid: string): Promise<Account> {
    try {
      const account = await Account.findByUID(uid);
      errorService.assertExists(account, 'Account', uid);

      httpLogger.info(`User logged in: ${account.email}`, { userId: account.uid });
      cliLogger.info(`User authenticated: ${account.email}`);

      return account;
    } catch (error) {
      throw errorService.handleError(error, `login(${uid})`);
    }
  }

  /**
   * Registers a new account with the provided details
   *
   * @param name - Display name for the account
   * @param email - Email address for the account
   * @param uid - Firebase user ID
   * @returns The newly created account
   * @throws {ConflictError} If an account with the provided email or uid already exists
   */
  public async register(name: string, email: string, uid: string): Promise<Account> {
    try {
      const existingAccountByEmail = await Account.findByEmail(email);
      errorService.assertNotExists(existingAccountByEmail, 'Account', 'email', email);

      const existingAccountByUID = await Account.findByUID(uid);
      errorService.assertNotExists(existingAccountByUID, 'Account', 'uid', uid);

      const account = new Account(name, email, uid);
      await account.register();

      httpLogger.info(`New user registered: ${email}`, { userId: uid });
      cliLogger.info(`New account created: ${email}`);

      return account;
    } catch (error) {
      throw errorService.handleError(error, `register(${name}, ${email}, ${uid})`);
    }
  }

  /**
   * Handles authentication via Google, either logging in an existing user
   * or creating a new account if the user doesn't exist
   *
   * @param name - Display name from Google profile
   * @param email - Email address from Google profile
   * @param uid - Firebase user ID
   * @returns Object containing the account and whether it was newly created
   */
  public async googleLogin(name: string, email: string, uid: string): Promise<GoogleLoginResponse> {
    try {
      const existingAccount = await Account.findByUID(uid);

      if (existingAccount) {
        httpLogger.info(`User logged in via Google: ${existingAccount.email}`, { userId: existingAccount.uid });
        cliLogger.info(`Google authentication: existing user ${existingAccount.email}`);

        return {
          account: existingAccount,
          isNewAccount: false,
        };
      }

      const existingEmailAccount = await Account.findByEmail(email);
      if (existingEmailAccount) {
        throw new ForbiddenError(
          `An account with email ${email} already exists but is not linked to this Google account`,
        );
      }

      const newAccount = new Account(name, email, uid);
      await newAccount.register();

      httpLogger.info(`New user registered via Google: ${email}`, { userId: uid });
      cliLogger.info(`Google authentication: new account created for ${email}`);

      return {
        account: newAccount,
        isNewAccount: true,
      };
    } catch (error) {
      throw errorService.handleError(error, `googleLogin(${name}, ${email}, ${uid})`);
    }
  }

  /**
   * Logs out a user by invalidating their cache
   *
   * @param accountId - ID of the account being logged out
   */
  public async logout(accountId: string): Promise<void> {
    try {
      this.cache.invalidateAccount(accountId);
      cliLogger.info(`User logged out: account ID ${accountId}`);
    } catch (error) {
      throw errorService.handleError(error, `logout(${accountId})`);
    }
  }
}

export const authenticationService = new AuthenticationService();
