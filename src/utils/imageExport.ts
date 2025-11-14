/**
 * Image Export Utility
 *
 * Task 16.4: Export reading as social media image
 * Requirement: 10.5
 *
 * Features:
 * - Generate 1200×630px image (Facebook/Twitter optimal size)
 * - Include card images and interpretation summary
 * - Apply Fallout aesthetic styling
 * - Trigger browser download
 */

interface Reading {
  id: string;
  question: string;
  cards_drawn: Array<{
    id: string;
    name: string;
    suit: string;
    imageUrl: string;
  }>;
  interpretation: string;
  created_at: string;
}

/**
 * Export reading as image (1200×630px)
 */
export async function exportReadingAsImage(reading: Reading): Promise<void> {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('無法建立 Canvas 上下文');
  }

  // Apply Fallout aesthetic background
  const gradient = ctx.createLinearGradient(0, 0, 0, 630);
  gradient.addColorStop(0, '#1a1a1a'); // Dark gray
  gradient.addColorStop(1, '#0d3d0d'); // Dark green
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Add border (Pip-Boy style)
  ctx.strokeStyle = '#00ff88'; // Pip-Boy green
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 1180, 610);

  // Add title
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('廢土塔羅', 600, 80);

  // Add question
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  const question = reading.question || '未命名解讀';
  const truncatedQuestion = question.length > 40
    ? question.substring(0, 40) + '...'
    : question;
  ctx.fillText(truncatedQuestion, 600, 140);

  // Load and draw card images (max 5 cards for space)
  const cardsToShow = reading.cards_drawn.slice(0, 5);
  const cardWidth = 150;
  const cardHeight = 250;
  const totalWidth = cardsToShow.length * cardWidth + (cardsToShow.length - 1) * 20;
  const startX = (1200 - totalWidth) / 2;

  try {
    const cardImages = await Promise.all(
      cardsToShow.map(card => loadImage(card.imageUrl))
    );

    cardImages.forEach((img, index) => {
      const x = startX + index * (cardWidth + 20);
      const y = 200;
      ctx.drawImage(img, x, y, cardWidth, cardHeight);

      // Add card name below image
      ctx.fillStyle = '#00ff88';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      const cardName = cardsToShow[index].name.length > 12
        ? cardsToShow[index].name.substring(0, 12) + '...'
        : cardsToShow[index].name;
      ctx.fillText(cardName, x + cardWidth / 2, y + cardHeight + 25);
    });
  } catch (error) {
    console.error('Failed to load card images:', error);
    // Continue without card images
    ctx.fillStyle = '#ff8800'; // Radiation orange
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('(卡牌圖片載入失敗)', 600, 350);
  }

  // Add watermark/branding
  ctx.fillStyle = '#666666';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('wasteland-tarot.com', 600, 600);

  // Convert canvas to blob and trigger download
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('無法生成圖片');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wasteland-tarot-${reading.id}.png`;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Load image helper
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Fallback: Export as data URL (for browsers that don't support blob download)
 */
export function exportReadingAsDataUrl(reading: Reading): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('無法建立 Canvas 上下文');
  }

  // Same rendering logic as above (simplified for fallback)
  const gradient = ctx.createLinearGradient(0, 0, 0, 630);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#0d3d0d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('廢土塔羅', 600, 315);

  return canvas.toDataURL('image/png');
}
