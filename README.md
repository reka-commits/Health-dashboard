# Mini Health Dashboard

A comprehensive full-stack application for health data visualization and analysis, featuring a React frontend, a Koa backend, and a Model Context Protocol (MCP) server for AI-powered clinical insights.

## Architecture

The project is split into two main components:

### Frontend (`/frontend`)
- **Framework**: React with Vite for fast development and building.
- **Styling**: Material-UI (MUI) for a clean, professional medical interface.
- **Data Visualization**: MUI-X-Charts for rendering biomarker trends and distributions.
- **State Management**: React hooks and local state for simple, efficient data flow.
- **Communication**: Axios for interacting with the backend REST API.

### Backend (`/backend`)
- **Server**: Koa.js, a lightweight and expressive Node.js framework.
- **Language**: TypeScript for type safety and better developer experience.
- **AI Integration**: Anthropic SDK for Claude-powered insights.
- **MCP Server**: A dedicated Model Context Protocol server for exposing health data and analysis tools to AI clients.
- **Data**: In-memory mock data system representing patients and their longitudinal biomarker records.

---

## Setup and Run Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone and Install
```bash
git clone <repository-url>
cd Mini-Health-Dashboard
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```
Run the development server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

---

## Model Context Protocol (MCP) Server

The backend includes a built-in MCP server that allows AI agents (like Cursor or Claude Desktop) to interact directly with the health data.

### How it Works
The MCP server uses **Stdio Transport** to communicate. It implements the Model Context Protocol to expose:
- **Tools**: Executable functions the AI can call to fetch or process data.
- **Resources**: Read-only data sources (like patient lists) that provide context.
- **Prompts**: Pre-defined templates that help the AI generate structured clinical summaries.

### Exposed Tools & Why
- `list_patients`: **Why**: Provides the AI with an entry point to discover available patient records.
- `get_patient_biomarkers`: **Why**: Enables deep-dives into specific patient data for longitudinal analysis.
- `analyze_biomarkers`: **Why**: Encapsulates deterministic clinical logic (reference range checks) so the AI doesn't have to "guess" if a value is high or low.
- `analyze_custom_biomarkers`: **Why**: Extends analysis capabilities to data not currently in the database, useful for "what-if" scenarios or external data validation.
- `get_monitoring_priorities`: **Why**: Provides a ranked list of concerns (Critical/High/Medium) based on medical heuristics, aiding the AI in focusing its summary on what matters most.

### Resources & Prompts
- **Resources**: Exposes `patients://list` and `patients://{id}/biomarkers` as JSON resources, allowing LLMs to "read" the database state directly.
- **Prompts**: Includes `patient_health_summary`, which guides the AI to produce a professional clinical overview by combining raw data with the preliminary rule-based analysis.

### Integrating with AI Clients

#### Cursor
1. Go to **Cursor Settings** > **Features** > **MCP**.
2. Click **+ Add Server**.
3. **Name**: `Health Dashboard`
4. **Type**: `command`
5. **Command**: `node /path/to/project/backend/dist/mcp/server.js`

#### Claude Desktop
Add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "health-dashboard": {
      "command": "node",
      "args": ["/path/to/project/backend/dist/mcp/server.js"]
    }
  }
}
```

---

## Decisions and Rationale

1. **Deterministic vs. Generative Hybrid**: I implemented a core rule-based analysis engine (`analysis.ts`) for deterministic clinical logic (like reference range checks and priority scoring). This ensures the AI has a "ground truth" to work from, while using the LLM for the final narrative interpretation and patient-friendly explanations.
2. **Koa over Express**: Chose Koa for its modern async/await middleware stack. It provides a more robust foundation for handling the asynchronous nature of MCP tool calls and external AI API requests.
3. **MUI-X Charts & Material UI**: Selected to provide a "professional medical grade" UI. MUI-X Charts handles the complexity of time-series biomarker data visualization, which is critical for clinical decision support.
5. **Stdio MCP Transport**: Opted for Stdio transport as it is the standard for local integrations with tools like Cursor and Claude Desktop, requiring no complex networking setup for the user.
6. **In-Memory Data Store**: For this prototype, an in-memory store was chosen to simplify the setup and ensure the application runs "out of the box" without needing a separate database installation, while still following a structure that could easily migrate to PostgreSQL or MongoDB.
