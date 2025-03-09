import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Represents a system notification displayed to users
 * @class Notification
 */
class Notification {
  /** Unique identifier for the notification */
  notification_id: number;
  /** Content of the notification to be displayed to the user */
  message: string;
  /** Date when the notification becomes active/visible */
  start_date: Date;
  /** Date when the notification expires/becomes inactive */
  end_date: Date;

  /**
   * Creates a new Notification instance
   * @param {number} notification_id - Unique identifier for the notification
   * @param {string} message - Content of the notification
   * @param {Date} start_date - Date when the notification becomes active
   * @param {Date} end_date - Date when the notification expires
   */
  constructor(notification_id: number, message: string, start_date: Date, end_date: Date) {
    this.notification_id = notification_id;
    this.message = message;
    this.start_date = start_date;
    this.end_date = end_date;
  }

  /**
   * Retrieves all active notifications for a specific account
   * @param {number} accountId - The account ID to fetch notifications for
   * @returns {Promise<Notification[]>} Array of active notifications for the account
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async getNotificationsForAccount(accountId: number): Promise<Notification[]> {
    try {
      const query = `SELECT n.notification_id, n.message, n.start_date, n.end_date FROM notifications n JOIN account_notifications an ON n.notification_id = an.notification_id WHERE an.account_id = ? AND an.dismissed = 0 AND NOW() BETWEEN n.start_date AND n.end_date;`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [accountId]);

      return rows.map((row) => new Notification(row.notification_id, row.message, row.start_date, row.end_date));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting account notifications';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Marks a notification as dismissed for a specific account
   * @param {number} notificationId - ID of the notification to dismiss
   * @param {number} accountId - ID of the account that is dismissing the notification
   * @returns {Promise<boolean>} True if the notification was successfully dismissed, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async dismissNotification(notificationId: number, accountId: number): Promise<boolean> {
    try {
      const query = `UPDATE account_notifications SET dismissed = 1 WHERE notification_id = ? AND account_id = ?;`;
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [notificationId, accountId]);

      // Return true if at least one row was affected (notification was dismissed)
      return result.affectedRows > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error dismissing a notification';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Notification;
