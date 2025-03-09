import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class Notification {
  notification_id: number;
  message: string;
  start_date: Date;
  end_date: Date;

  constructor(notification_id: number, message: string, start_date: Date, end_date: Date) {
    this.notification_id = notification_id;
    this.message = message;
    this.start_date = start_date;
    this.end_date = end_date;
  }

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

  static async dismissNotification(notificationId: number, accountId: number): Promise<boolean> {
    try {
      const query = `UPDATE account_notifications SET dismissed = 1 WHERE notification_id = ? AND account_id = ?;`;
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [notificationId, accountId]);

      if (result.affectedRows === 0) {
        return false;
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error dismissing a notification';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Notification;
