# Script Utilities

This directory contains utility scripts for the Helios Testnet application.

## Social Media Card Generation

The `generate-social-image.js` script creates a social media card image for the application.

### Prerequisites

Before running the script, install the required dependencies:

```bash
npm install canvas
```

### Usage

Run the script from the project root directory:

```bash
node scripts/generate-social-image.js
```

This will generate a `helios-social-card.png` file in the `public/images` directory. The image is optimized for social media sharing with dimensions of 1200x630 pixels.

### Customization

To modify the social card appearance, edit the `generate-social-image.js` script. You can change:

- Background colors
- Text content
- Font styles
- Image positions
- Overall layout

After making changes, run the script again to generate a new image. 