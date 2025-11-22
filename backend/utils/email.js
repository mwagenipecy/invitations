import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { generateInvitationPDF } from './pdfGenerator.js';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_ENCRYPTION === 'ssl',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendInvitationEmail = async (invitee, event, qrCodeData, eventId, inviteeId) => {
  try {
    // Verify email configuration
    if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
      console.error('Email credentials not configured. Please check .env file.');
      throw new Error('Email configuration missing');
    }

    // Generate QR code as data URL for email preview
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    
    // Generate PDF invitation card
    const pdfBuffer = await generateInvitationPDF(invitee, event, qrCodeData);
    
    console.log(`Sending email to: ${invitee.email}`);

    const fileName = `${event.title.replace(/\s+/g, '_')}_${invitee.name || 'Invitation'}.pdf`;
    
    // Get family name from environment or use default
    const familyName = process.env.MAIL_FAMILY_NAME || 'Tesha Family';
    const guestName = invitee.name || 'Guest';
    
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Invitees'}" <${process.env.MAIL_FROM_ADDRESS || 'nonreply@invitees.com'}>`,
      to: invitee.email,
      subject: `Invitation: ${event.title}`,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; background: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .content { background: #ffffff; padding: 40px; }
            .greeting { color: #1f2937; font-size: 16px; margin-bottom: 20px; }
            .body-text { color: #4b5563; font-size: 14px; margin-bottom: 25px; line-height: 1.8; }
            .event-info { background: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
            .qr-section { text-align: center; margin: 30px 0; }
            .qr-code { max-width: 150px; margin: 20px auto; }
            .attachment-notice { background: #f3f4f6; padding: 15px; margin: 25px 0; border-radius: 6px; border: 1px solid #d1d5db; }
            .closing { margin-top: 40px; color: #1f2937; font-size: 14px; }
            .signature { color: #1f2937; font-size: 14px; font-weight: 500; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <div class="greeting">
                Dear ${guestName},
              </div>
              
              <div class="body-text">
                We would like to cordially invite you to join us for a special occasion. <strong style="color: #1f2937;">${event.title}</strong>${event.description ? ` ${event.description}` : ''} on ${new Date(event.start_time).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })} at ${new Date(event.start_time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}. The event will be held at ${event.location}. Your presence would be an honor and make this event truly memorable. We have attached your personalized invitation card as a PDF file, which includes your unique QR code for event check-in.
              </div>

              <div class="qr-section">
                <img src="${qrCodeImage}" alt="QR Code" class="qr-code" />
              </div>

              <div class="body-text">
                We look forward to celebrating this special occasion with you.
              </div>

              <div class="closing">
                <p style="margin: 0;">Regards,</p>
                <p class="signature">${familyName}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. For Gmail:');
      console.error('1. Make sure 2-Factor Authentication is enabled');
      console.error('2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.error('3. Use the App Password instead of your regular password');
    }
    
    throw error;
  }
};

