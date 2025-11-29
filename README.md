# Aarambh 112 - Computer Aided Dispatch (CAD) System

Aarambh 112 is a next-generation Computer Aided Dispatch (CAD) system designed to streamline emergency response operations. This dashboard provides dispatchers with real-time situational awareness, AI-driven insights, and efficient resource management tools.

## Key Features

### Dispatcher Dashboard
A unified, single-screen interface designed for high-pressure environments. The layout is optimized for quick information intake and decision-making.

### Call & Situation Management
- **Call Details Panel**: Displays real-time caller information including Name, Contact, Location, and Incident Type.
- **Situation Assessment**: Tracks critical patient vitals (Consciousness, Breathing) and reported symptoms.
- **Live Notes**: Auto-generated notes from the voice agent intake, including fake call probability and language detection.

### GIS Map Panel
- **Interactive Map**: Built with Leaflet, providing a dark-mode visualization of the incident location.
- **Real-time Tracking**: Visualizes the incident location and the real-time positions of available resources (Ambulances, Fire, Police).
- **Route Visualization**: Shows estimated routes from resources to the incident scene.

### Resource Management
- **Smart Resource Table**: Lists available units with calculated ETAs and distances based on live location data.
- **AI Suggestions**: Automatically highlights the most appropriate resources based on the incident type (e.g., suggesting ALS Ambulances for Cardiac Arrest).
- **One-Click Dispatch**: Streamlined selection and dispatch process.

### AI Assistant
- **Protocol Guidance**: An integrated chat assistant that guides dispatchers through standard operating protocols (SOPs).
- **Smart Recommendations**: Suggests next steps and resources based on the evolving situation.

## Tech Stack
- **Frontend**: React 19, Vite
- **Maps**: Leaflet, React-Leaflet
- **Styling**: CSS Modules, Responsive Grid Layout
- **State Management**: React Hooks (useState, useEffect)

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChiragAgarwal78/Aarambh.git
   cd Aarambh
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Dashboard Overview
The dashboard features a responsive 3-column layout:
1. **Left**: Caller Details & Situation Assessment
2. **Center**: GIS Map & Resource Table (with Action Bar)
3. **Right**: AI Assistant & Protocol Chat
