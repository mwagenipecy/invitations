import express from 'express';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT e.*, 
        COUNT(DISTINCT i.id) as total_invitees,
        COUNT(DISTINCT CASE WHEN i.confirmed = 1 THEN i.id END) as confirmed_invitees
      FROM events e
      LEFT JOIN invitees i ON e.id = i.event_id
      GROUP BY e.id
      ORDER BY e.start_time DESC
    `);

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event (public access for confirmation page)
router.get('/:id', async (req, res) => {
  try {
    const [events] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true, event: events[0] });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, location, start_time, end_time } = req.body;

    if (!title || !location || !start_time || !end_time) {
      return res.status(400).json({ error: 'Title, location, start_time, and end_time are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO events (title, description, location, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, location, start_time, end_time, req.user.id]
    );

    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, event: events[0] });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, location, start_time, end_time } = req.body;

    await pool.query(
      'UPDATE events SET title = ?, description = ?, location = ?, start_time = ?, end_time = ? WHERE id = ?',
      [title, description, location, start_time, end_time, req.params.id]
    );

    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);

    res.json({ success: true, event: events[0] });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get invitees for an event
router.get('/:id/invitees', authenticateToken, async (req, res) => {
  try {
    const [invitees] = await pool.query(
      'SELECT * FROM invitees WHERE event_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    // Convert confirmed and checked_in fields from 1/0 to boolean for consistency
    const formattedInvitees = invitees.map(invitee => ({
      ...invitee,
      confirmed: Boolean(invitee.confirmed),
      checked_in: Boolean(invitee.checked_in)
    }));

    res.json({ success: true, invitees: formattedInvitees });
  } catch (error) {
    console.error('Error fetching invitees:', error);
    res.status(500).json({ error: 'Failed to fetch invitees' });
  }
});

// Add invitee to event (phone only)
router.post('/:id/invitees', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const eventId = req.params.id;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if event exists
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Generate unique QR code
    const qrCodeData = crypto.randomBytes(32).toString('hex');
    const qrCode = `EVT-${eventId}-${qrCodeData}`;

    // Check if invitee already exists for this event
    const [existing] = await pool.query(
      'SELECT * FROM invitees WHERE event_id = ? AND phone = ?',
      [eventId, phone]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Invitee with this phone number already exists for this event' });
    }

    const [result] = await pool.query(
      'INSERT INTO invitees (event_id, phone, qr_code) VALUES (?, ?, ?)',
      [eventId, phone, qrCode]
    );

    const [invitees] = await pool.query('SELECT * FROM invitees WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, invitee: invitees[0] });
  } catch (error) {
    console.error('Error adding invitee:', error);
    res.status(500).json({ error: 'Failed to add invitee' });
  }
});

export default router;

