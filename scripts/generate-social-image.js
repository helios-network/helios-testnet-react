const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateSocialCard() {
  // Create a canvas with 1200x630 dimensions (standard for social sharing)
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  try {
    // Load background image
    const bgImage = await loadImage(path.join(__dirname, '../public/images/Background.png'));
    
    // Draw background with light gradient overlay
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    
    // Add semi-transparent overlay for better text readability
    ctx.fillStyle = 'rgba(226, 235, 255, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add left accent bar
    const accentGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    accentGradient.addColorStop(0, '#002DCB');
    accentGradient.addColorStop(1, '#5170FF');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, 0, 10, canvas.height);
    
    // Add top accent bar
    const topAccentGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    topAccentGradient.addColorStop(0, '#002DCB');
    topAccentGradient.addColorStop(1, 'rgba(0, 45, 203, 0)');
    ctx.fillStyle = topAccentGradient;
    ctx.fillRect(0, 0, canvas.width, 10);
    
    // Add decorative elements
    // Circular gradient in bottom right
    const circleGradient = ctx.createRadialGradient(
      canvas.width - 100, canvas.height - 100, 50,
      canvas.width - 100, canvas.height - 100, 350
    );
    circleGradient.addColorStop(0, 'rgba(0, 45, 203, 0.12)');
    circleGradient.addColorStop(1, 'rgba(226, 235, 255, 0)');
    ctx.fillStyle = circleGradient;
    ctx.beginPath();
    ctx.arc(canvas.width - 100, canvas.height - 100, 300, 0, Math.PI * 2);
    ctx.fill();
    
    // Load icons for decoration
    const icon1 = await loadImage(path.join(__dirname, '../public/images/Icon1.svg'));
    const icon5 = await loadImage(path.join(__dirname, '../public/images/Icon5.svg'));
    const icon7 = await loadImage(path.join(__dirname, '../public/images/Icon7.svg'));
    
    // Draw icons as decorative elements
    ctx.globalAlpha = 0.15;
    ctx.drawImage(icon1, 900, 80, 40, 40);
    ctx.drawImage(icon5, 800, 500, 40, 40);
    ctx.drawImage(icon7, 100, 450, 40, 40);
    ctx.globalAlpha = 1.0;
    
    // Load and draw logo
    const logo = await loadImage(path.join(__dirname, '../public/images/logo.png'));
    const logoWidth = 120;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    ctx.drawImage(logo, 80, 60, logoWidth, logoHeight);
    
    // Load gradient overlay for visual appeal
    const gradient = await loadImage(path.join(__dirname, '../public/images/Gradient.png'));
    ctx.globalAlpha = 0.1;
    ctx.drawImage(gradient, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    
    // Add content container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    roundRect(ctx, 80, 190, canvas.width - 160, 350, 20, true);
    
    // Add title
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillStyle = '#040F34';
    ctx.textAlign = 'left';
    ctx.fillText('Helios Testnet', 100, 270);
    
    // Add gradient underline
    const underlineGradient = ctx.createLinearGradient(100, 0, 500, 0);
    underlineGradient.addColorStop(0, '#002DCB');
    underlineGradient.addColorStop(1, '#5170FF');
    ctx.fillStyle = underlineGradient;
    ctx.fillRect(100, 290, 400, 5);
    
    // Add tagline
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#5C6584';
    ctx.fillText('Gamified Builder Experience', 100, 340);
    
    // Add description with better typography
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#828DB3';
    ctx.fillText('Earn XP by completing on-chain activities', 100, 400);
    ctx.fillText('Claim from faucets & invite friends', 100, 440);
    ctx.fillText('Join a growing community of builders & explorers', 100, 480);
    
    // Add CTA at bottom
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#002DCB';
    ctx.fillText('testnet.helioschain.network', 100, 520);
    
    // Save the image to a file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, '../public/images/helios-social-card.png'), buffer);
    
    console.log('Social card image generated successfully!');
  } catch (err) {
    console.error('Error generating social card:', err);
  }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

generateSocialCard(); 