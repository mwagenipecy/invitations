import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get total events count
    const [eventCounts] = await pool.query('SELECT COUNT(*) as total FROM events');
    const totalEvents = eventCounts[0]?.total || 0;

    // Get total invitees count
    const [inviteeCounts] = await pool.query('SELECT COUNT(*) as total FROM invitees');
    const totalInvitees = inviteeCounts[0]?.total || 0;

    // Get total users count
    const [userCounts] = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = userCounts[0]?.total || 0;

    // Get pending invitations (invitees that are not confirmed)
    const [pendingCounts] = await pool.query(
      'SELECT COUNT(*) as total FROM invitees WHERE confirmed = 0 OR confirmed IS NULL'
    );
    const pendingInvitations = pendingCounts[0]?.total || 0;

    // Get events count in last 30 days
    const [recentEventCounts] = await pool.query(
      'SELECT COUNT(*) as total FROM events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const recentEvents = recentEventCounts[0]?.total || 0;

    res.json({
      success: true,
      totalEvents,
      totalInvitees,
      totalUsers,
      pendingInvitations,
      recentEvents
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;

