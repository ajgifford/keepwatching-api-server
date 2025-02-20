import pool from '../utils/db';

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
    const query = `
      SELECT n.notification_id, n.message, n.start_date, n.end_date
      FROM notifications n
      JOIN account_notifications an ON n.notification_id = an.notification_id
      WHERE an.account_id = ? 
      AND an.dismissed = 0
      AND NOW() BETWEEN n.start_date AND n.end_date;
    `;

    const [rows] = await pool.execute(query, [accountId]);

    return (rows as any[]).map(
      (row) => new Notification(row.notification_id, row.message, row.start_date, row.end_date),
    );
  }

  static async dismissNotification(notificationId: number, accountId: number): Promise<void> {
    const query = `
      UPDATE account_notifications
      SET dismissed = 1
      WHERE notification_id = ? AND account_id = ?;
    `;

    const [result] = await pool.execute(query, [notificationId, accountId]);

    if ((result as any).affectedRows === 0) {
      throw new Error('Notification not found or already dismissed.');
    }
  }
}

export default Notification;
