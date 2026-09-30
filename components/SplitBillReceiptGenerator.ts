import { SplitBillItem } from '../types';
import { formatCurrency } from '../utils';

export interface GenerateReceiptOptions {
  theme?: 'dark' | 'light';
}

export const generateSplitBillReceiptCanvas = (
  bill: SplitBillItem,
  options: GenerateReceiptOptions = { theme: 'light' }
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    try {
      const isDark = options.theme === 'dark';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      // Base dimensions (scale x2 for retina high DPI)
      const width = 800;
      const baseHeight = 750;
      const rowHeight = 65;
      const height = baseHeight + (bill.participants.length * rowHeight) + (bill.notes ? 60 : 0);
      const scale = 2;

      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Background Card
      ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Decorative Banner Gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 140);
      gradient.addColorStop(0, '#4f46e5'); // Indigo 600
      gradient.addColorStop(0.5, '#6366f1'); // Indigo 500
      gradient.addColorStop(1, '#8b5cf6'); // Violet 500
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 140);

      // Watermark circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(width - 40, 20, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(60, 110, 60, 0, Math.PI * 2);
      ctx.fill();

      // Brand Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('SPENDWISE', 40, 48);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('BILL SPLIT RECEIPT', 40, 72);

      // Date on right
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '500 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(bill.date || new Date().toISOString().split('T')[0], width - 40, 48);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`#SPLIT-${bill.id.toUpperCase().slice(0, 6)}`, width - 40, 72);
      ctx.textAlign = 'left';

      // Bill Title Card
      let currentY = 175;
      ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      const displayTitle = bill.title.trim() || 'Split Expense';
      ctx.fillText(displayTitle, 40, currentY);

      // Total Amount Display Box
      currentY += 25;
      const boxY = currentY;
      const boxHeight = 110;
      ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(40, boxY, width - 80, boxHeight, 16);
      ctx.fill();

      // Inside Amount Box
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('TOTAL BILL AMOUNT', 65, boxY + 36);

      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(formatCurrency(bill.totalAmount), 65, boxY + 80);

      // Paid By & Split Type Badge on Right side of Box
      ctx.textAlign = 'right';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('PAID BY', width - 65, boxY + 36);

      ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(bill.paidBy, width - 65, boxY + 62);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Split ${bill.splitType === 'equal' ? 'Equally' : bill.splitType} (${bill.participants.length} Friends)`, width - 65, boxY + 85);
      ctx.textAlign = 'left';

      // Section Header: Friend Shares
      currentY = boxY + boxHeight + 35;
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('PARTICIPANTS & SETTLEMENTS', 40, currentY);

      // Table Header line
      currentY += 12;
      ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, currentY);
      ctx.lineTo(width - 40, currentY);
      ctx.stroke();

      currentY += 24;

      // Table Header text
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('PERSON', 50, currentY);
      ctx.fillText('SHARE AMOUNT', 380, currentY);
      ctx.textAlign = 'right';
      ctx.fillText('STATUS', width - 50, currentY);
      ctx.textAlign = 'left';

      currentY += 15;

      // Render Each Participant
      bill.participants.forEach((p, idx) => {
        currentY += 10;
        const rowBgY = currentY - 5;
        const isPayer = p.name.toLowerCase() === bill.paidBy.toLowerCase();
        
        // Alternating row background
        if (idx % 2 === 0) {
          ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(40, rowBgY, width - 80, 50, 10);
          ctx.fill();
        }

        // Person Name & Initial Avatar
        const avatarX = 55;
        const avatarY = rowBgY + 25;
        ctx.fillStyle = isPayer ? '#4f46e5' : '#8b5cf6';
        ctx.beginPath();
        ctx.arc(avatarX + 12, avatarY, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((p.name[0] || '?').toUpperCase(), avatarX + 12, avatarY + 4);
        ctx.textAlign = 'left';

        // Person Name
        ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(p.name, avatarX + 38, avatarY + 5);

        // Share Amount
        ctx.fillStyle = isDark ? '#e2e8f0' : '#0f172a';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.fillText(formatCurrency(p.shareAmount), 380, avatarY + 5);

        // Status Tag
        ctx.textAlign = 'right';
        if (isPayer) {
          ctx.fillStyle = '#059669'; // Green
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillText('✓ Paid Bill', width - 55, avatarY + 5);
        } else if (p.settled) {
          ctx.fillStyle = '#10b981'; // Green settled
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillText('✓ Settled', width - 55, avatarY + 5);
        } else {
          ctx.fillStyle = '#dc2626'; // Red owes
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillText(`Owes ${formatCurrency(p.shareAmount)}`, width - 55, avatarY + 5);
        }
        ctx.textAlign = 'left';

        currentY += 45;
      });

      // Notes if provided
      if (bill.notes) {
        currentY += 25;
        ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(40, currentY, width - 80, 50, 10);
        ctx.fill();

        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = 'italic 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Note: "${bill.notes}"`, 60, currentY + 30);
        currentY += 50;
      }

      // Perforation line
      currentY += 35;
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(40, currentY);
      ctx.lineTo(width - 40, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Receipt Footer Info
      currentY += 35;
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText('📲 Quick UPI Payment', 40, currentY);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText('Pay your share directly to the bill payer via GPay / PhonePe / Paytm / UPI', 40, currentY + 20);

      ctx.textAlign = 'right';
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('SPENDWISE SMART SPLIT', width - 40, currentY + 10);
      ctx.textAlign = 'left';

      // Export canvas as dataUrl & blob
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ dataUrl, blob });
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      }, 'image/png', 1.0);
    } catch (err) {
      reject(err);
    }
  });
};

export const downloadReceiptImage = (dataUrl: string, title: string) => {
  const link = document.createElement('a');
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'split-bill';
  link.download = `spendwise-bill-${cleanTitle}-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getWhatsAppShareText = (bill: SplitBillItem): string => {
  const perPerson = bill.splitType === 'equal' 
    ? (bill.totalAmount / (bill.participants.length || 1)).toFixed(2) 
    : 'as listed';

  const participantLines = bill.participants.map(p => {
    const isPayer = p.name.toLowerCase() === bill.paidBy.toLowerCase();
    if (isPayer) {
      return `• *${p.name}*: Paid full bill (${formatCurrency(bill.totalAmount)}) [Share: ${formatCurrency(p.shareAmount)}]`;
    }
    return `• *${p.name}*: ${p.settled ? '✅ Settled' : `Owes *${formatCurrency(p.shareAmount)}*`}`;
  }).join('\n');

  return `🧾 *SpendWise Split Bill Summary*
━━━━━━━━━━━━━━━━━━━━
🎉 *${bill.title || 'Bill Split'}*
💰 *Total Amount:* ${formatCurrency(bill.totalAmount)}
💳 *Paid By:* ${bill.paidBy}
📅 *Date:* ${bill.date}
👥 *Split Among:* ${bill.participants.length} Friends
${bill.splitType === 'equal' ? `💵 *Per Person:* ₹${perPerson}` : ''}

*Individual Breakdown:*
${participantLines}
${bill.notes ? `\n📝 *Note:* ${bill.notes}` : ''}

📲 *Please transfer your share via UPI / GPay / PhonePe.*
━━━━━━━━━━━━━━━━━━━━
_Generated via SpendWise Personal Finance Tracker_`;
};

export const getWhatsAppShareUrl = (bill: SplitBillItem): string => {
  const textMessage = getWhatsAppShareText(bill);
  const encoded = encodeURIComponent(textMessage);
  return `https://api.whatsapp.com/send?text=${encoded}`;
};

export const shareToWhatsApp = async (
  bill: SplitBillItem,
  imageBlob?: Blob,
  imageDataUrl?: string
) => {
  const textMessage = getWhatsAppShareText(bill);

  // Try Web Share API with image file if supported
  if (navigator.share && imageBlob) {
    try {
      const file = new File([imageBlob], `split-bill-${Date.now()}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Split Bill: ${bill.title}`,
          text: textMessage,
          files: [file]
        });
        return { sharedVia: 'native-file' };
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native file share failed, falling back to WhatsApp URL:', err);
      } else {
        return { sharedVia: 'cancelled' };
      }
    }
  }

  // Fallback: trigger image download & navigate safely without window.open
  if (imageDataUrl) {
    downloadReceiptImage(imageDataUrl, bill.title);
  }

  const whatsappUrl = getWhatsAppShareUrl(bill);
  const link = document.createElement('a');
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { sharedVia: 'whatsapp-url' };
};
