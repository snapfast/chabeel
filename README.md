# Chabeel Finder

Chabeel Finder is a fast, community-driven web application to locate and share Chabeel (free refreshing drink) locations. Built with Next.js, Leaflet, and Tailwind CSS.

## Features

- **Map View**: Visualize all Chabeel locations on an interactive map.
- **Search & Locate**: Find Chabeel locations near your current position.
- **Add Locations**: Easily add new Chabeel locations by clicking on the map.
- **Public Data**: All data is public and contributed by the community.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Mapping**: [Leaflet](https://leafletjs.org/) & [React Leaflet](https://react-leaflet.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Jest](https://jestjs.io/)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/snapfast/chabeel.git
   cd chabeel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

### Testing

Run unit tests:
```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

## Data Storage

Currently, locations are stored in a local JSON file (`data/locations.json`) for simplicity and public accessibility. In a production environment with high traffic, this could be migrated to a database like MongoDB or PostgreSQL.

## Contributing

This is a public domain project. Feel free to contribute by adding locations or improving the code.
