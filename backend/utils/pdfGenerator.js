import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateInvitationPDF = async (invitee, event, qrCodeData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        layout: 'landscape'
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code
      const qrCodeImage = await QRCode.toBuffer(qrCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#ec4899',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      // Page dimensions - Landscape A4
      const pageWidth = 842;  // A4 landscape width
      const pageHeight = 595; // A4 landscape height

      // Elegant white background with subtle texture
      doc.rect(0, 0, pageWidth, pageHeight)
        .fill('#fef7f7');

      // Card container with elegant spacing
      const cardMargin = 35;
      const cardWidth = pageWidth - (cardMargin * 2);
      const cardHeight = pageHeight - (cardMargin * 2);
      const cardX = cardMargin;
      const cardY = cardMargin;

      // Multi-layer shadow for depth
      doc.rect(cardX + 10, cardY + 10, cardWidth, cardHeight)
        .fill('rgba(219, 39, 119, 0.15)');
      doc.rect(cardX + 5, cardY + 5, cardWidth, cardHeight)
        .fill('rgba(219, 39, 119, 0.25)');

      // Main card background - elegant pink gradient
      const gradientSteps = 25;
      for (let i = 0; i < gradientSteps; i++) {
        const ratio = i / gradientSteps;
        const r = Math.floor(252 + (236 - 252) * ratio);
        const g = Math.floor(231 + (72 - 231) * ratio);
        const b = Math.floor(245 + (137 - 245) * ratio);
        const color = `rgb(${r}, ${g}, ${b})`;
        doc.rect(cardX, cardY + (cardHeight / gradientSteps) * i, cardWidth, cardHeight / gradientSteps)
          .fill(color);
      }

      // Elegant border frame with pink accent
      const borderWidth = 4;
      const borderColor = '#ec4899';
      doc.rect(cardX, cardY, cardWidth, borderWidth)
        .fill(borderColor);
      doc.rect(cardX, cardY + cardHeight - borderWidth, cardWidth, borderWidth)
        .fill(borderColor);
      doc.rect(cardX, cardY, borderWidth, cardHeight)
        .fill(borderColor);
      doc.rect(cardX + cardWidth - borderWidth, cardY, borderWidth, cardHeight)
        .fill(borderColor);

      // Decorative corner elements with elegant design
      const cornerSize = 30;
      const cornerThickness = 2.5;
      const cornerColor = '#ec4899';
      // Top-left corner - elegant L shape
      doc.moveTo(cardX + cornerSize, cardY + borderWidth)
        .lineTo(cardX + borderWidth, cardY + borderWidth)
        .lineTo(cardX + borderWidth, cardY + cornerSize)
        .strokeColor(cornerColor)
        .lineWidth(cornerThickness)
        .stroke();
      // Top-right corner
      doc.moveTo(cardX + cardWidth - cornerSize, cardY + borderWidth)
        .lineTo(cardX + cardWidth - borderWidth, cardY + borderWidth)
        .lineTo(cardX + cardWidth - borderWidth, cardY + cornerSize)
        .strokeColor(cornerColor)
        .lineWidth(cornerThickness)
        .stroke();
      // Bottom-left corner
      doc.moveTo(cardX + cornerSize, cardY + cardHeight - borderWidth)
        .lineTo(cardX + borderWidth, cardY + cardHeight - borderWidth)
        .lineTo(cardX + borderWidth, cardY + cardHeight - cornerSize)
        .strokeColor(cornerColor)
        .lineWidth(cornerThickness)
        .stroke();
      // Bottom-right corner
      doc.moveTo(cardX + cardWidth - cornerSize, cardY + cardHeight - borderWidth)
        .lineTo(cardX + cardWidth - borderWidth, cardY + cardHeight - borderWidth)
        .lineTo(cardX + cardWidth - borderWidth, cardY + cardHeight - cornerSize)
        .strokeColor(cornerColor)
        .lineWidth(cornerThickness)
        .stroke();

      // Elegant divider line with decorative pattern
      const dividerX = cardX + (cardWidth / 2);
      
      // Decorative dots pattern
      const dotRadius = 2.5;
      const dotSpacing = 10;
      let dotY = cardY + 50;
      while (dotY < cardY + cardHeight - 50) {
        doc.circle(dividerX, dotY, dotRadius)
          .fill('#ec4899');
        dotY += dotSpacing;
      }
      
      // Main divider line with elegant styling
      doc.moveTo(dividerX, cardY + 40)
        .lineTo(dividerX, cardY + cardHeight - 40)
        .strokeColor('#ec4899')
        .lineWidth(2)
        .stroke();
      
      // Decorative accent lines on divider
      doc.moveTo(dividerX - 15, cardY + 60)
        .lineTo(dividerX + 15, cardY + 60)
        .strokeColor('#ec4899')
        .lineWidth(1.5)
        .stroke();
      doc.moveTo(dividerX - 15, cardY + cardHeight - 60)
        .lineTo(dividerX + 15, cardY + cardHeight - 60)
        .strokeColor('#ec4899')
        .lineWidth(1.5)
        .stroke();

      // Left Section - Content
      const leftX = cardX + 55;
      const leftWidth = (cardWidth / 2) - 75;
      let leftY = cardY + 70;

      // Elegant header text with decorative underline
      doc.fillColor('#1f2937')
        .fontSize(12)
        .font('Helvetica')
        .text('YOU ARE CORDIALLY INVITED TO', leftX, leftY, {
          width: leftWidth,
          align: 'left',
          characterSpacing: 2
        });
      
      // Decorative underline
      const headerY = leftY + 15;
      doc.moveTo(leftX, headerY)
        .lineTo(leftX + 200, headerY)
        .strokeColor('#ec4899')
        .lineWidth(2)
        .stroke();
      
      leftY += 30;

      // Guest Name - Simple and elegant with black text
      if (invitee.name) {
        doc.fillColor('#1f2937')
          .fontSize(32)
          .font('Helvetica-Bold')
          .text(invitee.name, leftX, leftY, {
            width: leftWidth,
            lineGap: 5
          });

        const nameHeight = doc.heightOfString(invitee.name, { width: leftWidth, lineGap: 5 });
        leftY += nameHeight + 25;
      }

      // Event Title with elegant styling
      if (event.title) {
        doc.fillColor('#1f2937')
          .fontSize(26)
          .font('Helvetica-Bold')
          .text(event.title, leftX, leftY, {
            width: leftWidth,
            lineGap: 8
          });

        const titleHeight = doc.heightOfString(event.title, {
          width: leftWidth,
          lineGap: 8
        });
        leftY += titleHeight + 20;
      }

      // Event Description with refined typography
      if (event.description) {
        doc.fillColor('#374151')
          .fontSize(15)
          .font('Helvetica')
          .text(event.description, leftX, leftY, {
            width: leftWidth,
            lineGap: 8
          });
        leftY += doc.heightOfString(event.description, {
          width: leftWidth,
          lineGap: 8
        }) + 30;
      }

      // Date and Location section - well organized after event name
      const infoSectionY = leftY;
      const infoBoxPadding = 12;
      const infoItemSpacing = 20;

      // Date & Time
      if (event.start_time) {
        const dateText = new Date(event.start_time).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        const timeText = new Date(event.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // Pink accent bar
        doc.rect(leftX, infoSectionY, 4, 50)
          .fill('#ec4899');

        // Date label
        doc.fillColor('#ec4899')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('DATE & TIME', leftX + 12, infoSectionY + infoBoxPadding, {
            width: leftWidth - 12,
            align: 'left',
            characterSpacing: 1
          });

        // Date value
        doc.fillColor('#1f2937')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(dateText, leftX + 12, infoSectionY + infoBoxPadding + 12, {
            width: leftWidth - 12,
            align: 'left'
          });

        // Time value
        doc.fillColor('#374151')
          .fontSize(13)
          .font('Helvetica')
          .text(timeText, leftX + 12, infoSectionY + infoBoxPadding + 25, {
            width: leftWidth - 12,
            align: 'left'
          });

        leftY = infoSectionY + 60;
      }

      // Location
      if (event.location) {
        // Pink accent bar
        doc.rect(leftX, leftY, 4, 40)
          .fill('#ec4899');

        // Location label
        doc.fillColor('#ec4899')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('LOCATION', leftX + 12, leftY + infoBoxPadding, {
            width: leftWidth - 12,
            align: 'left',
            characterSpacing: 1
          });

        // Location value
        doc.fillColor('#1f2937')
          .fontSize(13)
          .font('Helvetica')
          .text(event.location, leftX + 12, leftY + infoBoxPadding + 12, {
            width: leftWidth - 12,
            align: 'left',
            lineGap: 4
          });
      }

      // Right Section - QR Code
      const rightX = dividerX + 35;
      const rightY = cardY + (cardHeight / 2) - 130;

      // QR Code container - elegant white frame
      const qrContainerSize = 250;
      const qrContainerX = rightX + ((cardWidth / 2) - 35 - qrContainerSize) / 2;
      const qrContainerY = rightY;

      // Multi-layer shadow for depth
      doc.rect(qrContainerX + 6, qrContainerY + 6, qrContainerSize, qrContainerSize)
        .fill('rgba(219, 39, 119, 0.2)');
      doc.rect(qrContainerX + 3, qrContainerY + 3, qrContainerSize, qrContainerSize)
        .fill('rgba(219, 39, 119, 0.15)');

      // Main white container with elegant border
      doc.rect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize)
        .fill('#FFFFFF')
        .stroke('rgba(255, 255, 255, 0.8)', 2);

      // Inner decorative border
      const innerBorderOffset = 8;
      doc.rect(qrContainerX + innerBorderOffset, qrContainerY + innerBorderOffset, 
               qrContainerSize - (innerBorderOffset * 2), qrContainerSize - (innerBorderOffset * 2))
        .stroke('rgba(236, 72, 153, 0.3)', 1);

      // QR Code image with elegant padding
      const qrPadding = 25;
      const qrSize = qrContainerSize - (qrPadding * 2);
      doc.image(qrCodeImage, qrContainerX + qrPadding, qrContainerY + qrPadding, {
        width: qrSize,
        height: qrSize
      });

      // Elegant CTA Text above QR code
      const ctaTopY = qrContainerY - 40;
      doc.fillColor('#1f2937')
        .fontSize(19)
        .font('Helvetica-Bold')
        .text('SCAN FOR CHECK-IN', rightX, ctaTopY, {
          width: (cardWidth / 2) - 35,
          align: 'center',
          characterSpacing: 2
        });

      // Elegant decorative lines above QR
      const lineY = qrContainerY - 18;
      doc.moveTo(qrContainerX + 40, lineY)
        .lineTo(qrContainerX + qrContainerSize - 40, lineY)
        .strokeColor('#ec4899')
        .lineWidth(2.5)
        .stroke();
      
      // Decorative dots on line
      doc.circle(qrContainerX + 50, lineY, 2.5)
        .fill('#ec4899');
      doc.circle(qrContainerX + qrContainerSize - 50, lineY, 2.5)
        .fill('#ec4899');

      // Reference text below QR code
      const refY = qrContainerY + qrContainerSize + 25;
      doc.fillColor('#374151')
        .fontSize(12)
        .font('Helvetica')
        .text('Present this QR code at the entrance', rightX, refY, {
          width: (cardWidth / 2) - 35,
          align: 'center',
          lineGap: 5
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
