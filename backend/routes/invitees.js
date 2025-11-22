import express from 'express';
import crypto from 'crypto';
import pool from '../database/connection.js';
import { sendInvitationEmail } from '../utils/email.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all invitees (protected)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const [invitees] = await pool.query(
      `SELECT i.*, e.title as event_title 
       FROM invitees i 
       LEFT JOIN events e ON i.event_id = e.id 
       ORDER BY i.created_at DESC`
    );
    res.json({ success: true, invitees });
  } catch (error) {
    console.error('Error fetching invitees:', error);
    res.status(500).json({ error: 'Failed to fetch invitees' });
  }
});

// Create invitee (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, event_id, notes } = req.body;

    if (!phone || !event_id) {
      return res.status(400).json({ error: 'Phone number and event ID are required' });
    }

    const qrCode = crypto.randomBytes(16).toString('hex');

    const [result] = await pool.query(
      'INSERT INTO invitees (name, email, phone, event_id, qr_code, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, email || null, phone, event_id, qrCode, notes || null]
    );

    const [invitees] = await pool.query(
      'SELECT i.*, e.title as event_title FROM invitees i LEFT JOIN events e ON i.event_id = e.id WHERE i.id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, invitee: invitees[0] });
  } catch (error) {
    console.error('Error creating invitee:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Invitee with this phone number already exists for this event' });
    }
    res.status(500).json({ error: 'Failed to create invitee' });
  }
});

// Send invitation email (protected)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { invitee_id, event_id } = req.body;

    const [invitees] = await pool.query(
      'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.id = ? AND i.event_id = ?',
      [invitee_id, event_id]
    );

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    const invitee = invitees[0];

    if (!invitee.email) {
      return res.status(400).json({ error: 'Invitee email is required' });
    }

    await sendInvitationEmail(
      { email: invitee.email, name: invitee.name, phone: invitee.phone },
      {
        title: invitee.title,
        description: invitee.description,
        location: invitee.location,
        start_time: invitee.start_time
      },
      invitee.qr_code,
      event_id,
      invitee.id
    );

    await pool.query(
      'UPDATE invitees SET email_sent = 1, email_sent_at = NOW() WHERE id = ?',
      [invitee.id]
    );

    res.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Update invitee confirmation status (protected - for manual check-in)
router.put('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { confirmed, email, name } = req.body;
    const inviteeId = req.params.id;

    const updateFields = [];
    const updateValues = [];

    if (confirmed !== undefined) {
      updateFields.push('confirmed = ?');
      updateValues.push(confirmed ? 1 : 0);
      if (confirmed) {
        updateFields.push('confirmed_at = NOW()');
      } else {
        updateFields.push('confirmed_at = NULL');
        // If unconfirming, also uncheck in
        updateFields.push('checked_in = 0');
        updateFields.push('checked_in_at = NULL');
      }
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email || null);
    }

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(inviteeId);

    await pool.query(
      `UPDATE invitees SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [invitees] = await pool.query(
      'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.id = ?',
      [inviteeId]
    );

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    res.json({ success: true, invitee: invitees[0] });
  } catch (error) {
    console.error('Error updating invitee:', error);
    res.status(500).json({ error: 'Failed to update invitee' });
  }
});

// Check in invitee by ID (protected - for manual check-in from table)
router.put('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const inviteeId = req.params.id;
    const { checked_in } = req.body;

    // First check if invitee exists and is confirmed
    const [invitees] = await pool.query(
      'SELECT * FROM invitees WHERE id = ?',
      [inviteeId]
    );

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    const invitee = invitees[0];

    // Only allow check-in if invitee is confirmed
    if (!invitee.confirmed || invitee.confirmed === 0) {
      return res.status(400).json({ error: 'Invitee must be confirmed before checking in' });
    }

    // Update checked-in status
    if (checked_in === true || checked_in === 1) {
      await pool.query(
        'UPDATE invitees SET checked_in = 1, checked_in_at = NOW() WHERE id = ?',
        [inviteeId]
      );
    } else {
      await pool.query(
        'UPDATE invitees SET checked_in = 0, checked_in_at = NULL WHERE id = ?',
        [inviteeId]
      );
    }

    const [updatedInvitees] = await pool.query(
      'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.id = ?',
      [inviteeId]
    );

    if (updatedInvitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    res.json({ success: true, invitee: updatedInvitees[0] });
  } catch (error) {
    console.error('Error updating check-in status:', error);
    res.status(500).json({ error: 'Failed to update check-in status' });
  }
});

// Check in invitee by phone or QR code (protected - for manual check-in)
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { phone, qr_code, event_id } = req.body;

    console.log('Check-in request:', { phone, qr_code, event_id });

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!phone && !qr_code) {
      return res.status(400).json({ error: 'Phone number or QR code is required' });
    }

    let query = 'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.event_id = ?';
    const params = [event_id];

    if (phone) {
      query += ' AND i.phone = ?';
      params.push(phone);
    } else if (qr_code) {
      query += ' AND i.qr_code = ?';
      params.push(qr_code);
    }

    const [invitees] = await pool.query(query, params);

    console.log('Found invitees for check-in:', invitees.length);

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found for this event' });
    }

    const invitee = invitees[0];

    // Check if invitee is confirmed - only confirmed invitees can be checked in
    if (!invitee.confirmed || invitee.confirmed === 0) {
      return res.status(400).json({ error: 'Invitee must be confirmed before checking in' });
    }

    // Check if already checked in
    if (invitee.checked_in === 1 || invitee.checked_in === true) {
      return res.status(400).json({ error: 'Invitee is already checked in' });
    }

    // Update checked-in status
    const [updateResult] = await pool.query(
      'UPDATE invitees SET checked_in = 1, checked_in_at = NOW() WHERE id = ?',
      [invitee.id]
    );

    console.log('Check-in update result:', { affectedRows: updateResult.affectedRows, inviteeId: invitee.id });

    const [updatedInvitees] = await pool.query(
      'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.id = ?',
      [invitee.id]
    );

    if (updatedInvitees.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve updated invitee' });
    }

    // Convert checked_in to boolean
    const updatedInvitee = {
      ...updatedInvitees[0],
      checked_in: Boolean(updatedInvitees[0].checked_in)
    };

    res.json({ success: true, invitee: updatedInvitee });
  } catch (error) {
    console.error('Error checking in invitee:', error);
    res.status(500).json({ error: 'Failed to check in invitee' });
  }
});

// Delete invitee (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM invitees WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    res.json({ success: true, message: 'Invitee deleted successfully' });
  } catch (error) {
    console.error('Error deleting invitee:', error);
    res.status(500).json({ error: 'Failed to delete invitee' });
  }
});

// Public endpoint: Confirm attendance
router.post('/confirm', async (req, res) => {
  try {
    const { phone, email, name, event_id } = req.body;

    console.log('Confirmation request:', { phone, email, name, event_id, body: req.body });

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventIdInt = parseInt(event_id);
    if (isNaN(eventIdInt)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Check if event exists
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [eventIdInt]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = events[0];

    // Step 1: Find invitee by phone and event_id - phone number MUST be in the invitees list
    const [invitees] = await pool.query(
      'SELECT * FROM invitees WHERE phone = ? AND event_id = ?',
      [phone, eventIdInt]
    );

    console.log('Found invitees:', invitees.length, invitees[0] ? { id: invitees[0].id, phone: invitees[0].phone, confirmed: invitees[0].confirmed } : 'none');

    // Step 2: If not found, return error - cannot confirm
    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Phone number not found in invitation list for this event. Please contact the event organizer.' });
    }

    const invitee = invitees[0];

    // Step 3: Check if already confirmed - cannot confirm twice
    if (invitee.confirmed === 1 || invitee.confirmed === true) {
      return res.status(400).json({ error: 'You have already confirmed your attendance for this event' });
    }

    // Step 4: Update the invitee record
    const [updateResult] = await pool.query(
      'UPDATE invitees SET email = ?, name = ?, confirmed = 1, confirmed_at = NOW() WHERE phone = ? AND event_id = ? AND confirmed = 0',
      [email || null, name || null, phone, eventIdInt]
    );

    console.log('Update result:', { 
      affectedRows: updateResult.affectedRows, 
      phone: phone, 
      eventId: eventIdInt 
    });

    // Step 5: Verify update was successful
    if (updateResult.affectedRows === 0) {
      // Check if it was already confirmed
      const [checkInvitees] = await pool.query(
        'SELECT * FROM invitees WHERE phone = ? AND event_id = ?',
        [phone, eventIdInt]
      );
      if (checkInvitees.length > 0 && (checkInvitees[0].confirmed === 1 || checkInvitees[0].confirmed === true)) {
        return res.status(400).json({ error: 'You have already confirmed your attendance for this event' });
      }
      return res.status(500).json({ error: 'Failed to update confirmation. Please try again.' });
    }

    // Step 6: Fetch the updated invitee record
    const [updatedInvitees] = await pool.query(
      'SELECT * FROM invitees WHERE phone = ? AND event_id = ?',
      [phone, eventIdInt]
    );

    if (updatedInvitees.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve updated confirmation. Please try again.' });
    }

    const updatedInvitee = {
      ...updatedInvitees[0],
      title: event.title,
      description: event.description,
      location: event.location,
      start_time: event.start_time,
      end_time: event.end_time
    };

    console.log('Updated invitee:', { 
      id: updatedInvitee.id, 
      phone: updatedInvitee.phone,
      qr_code: updatedInvitee.qr_code, 
      confirmed: updatedInvitee.confirmed,
      confirmed_at: updatedInvitee.confirmed_at
    });

    // Step 7: Send email ONLY if update was successful and email is provided
    if (email && updatedInvitee.qr_code) {
      try {
        await sendInvitationEmail(
          { email, name, phone },
          {
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.start_time
          },
          updatedInvitee.qr_code,
          eventIdInt,
          updatedInvitee.id
        );
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Step 8: Return success response with confirmed as boolean for frontend
    const responseInvitee = {
      ...updatedInvitee,
      confirmed: Boolean(updatedInvitee.confirmed === 1 || updatedInvitee.confirmed === true)
    };

    res.json({
      success: true,
      message: email ? 'Confirmation successful! Check your email for the invitation with QR code.' : 'Confirmation successful!',
      invitee: responseInvitee
    });
  } catch (error) {
    console.error('Error confirming attendance:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: error.message || 'Failed to confirm attendance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get invitee by phone and event (for public confirmation page)
router.post('/check', async (req, res) => {
  try {
    const { phone, event_id } = req.body;

    if (!phone || !event_id) {
      return res.status(400).json({ error: 'Phone number and event ID are required' });
    }

    const [invitees] = await pool.query(
      'SELECT i.*, e.title as event_title FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.phone = ? AND i.event_id = ?',
      [phone, event_id]
    );

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Phone number not found in invitation list for this event' });
    }

    res.json({ success: true, invitee: invitees[0] });
  } catch (error) {
    console.error('Error checking invitee:', error);
    res.status(500).json({ error: 'Failed to check invitee' });
  }
});

// Get invitee by QR code (for invitation card) - Must come before /:id route
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const [invitees] = await pool.query(
      'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.qr_code = ?',
      [req.params.qrCode]
    );

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({ success: true, invitee: invitees[0], event: invitees[0] });
  } catch (error) {
    console.error('Error fetching invitee by QR code:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// Get invitee by ID (for invitation card)
router.get('/:id', async (req, res) => {
  try {
    const [invitees] = await pool.query(
      'SELECT i.*, e.* FROM invitees i JOIN events e ON i.event_id = e.id WHERE i.id = ?',
      [req.params.id]
    );

    if (invitees.length === 0) {
      return res.status(404).json({ error: 'Invitee not found' });
    }

    res.json({ success: true, invitee: invitees[0], event: invitees[0] });
  } catch (error) {
    console.error('Error fetching invitee:', error);
    res.status(500).json({ error: 'Failed to fetch invitee' });
  }
});

export default router;
