import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { patients, biomarkers } from "../data/mockData.js";
import { analyzeBiomarkers, suggestPriorities } from "./analysis.js";

const server = new Server(
  {
    name: "health-dashboard-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes tools for fetching patient data and analyzing biomarkers.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_patients",
        description: "List all patients in the system",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_patient_biomarkers",
        description: "Get all biomarkers for a specific patient by their ID",
        inputSchema: {
          type: "object",
          properties: {
            patientId: {
              type: "string",
              description: "The ID of the patient (e.g., 'p1', 'p2')",
            },
          },
          required: ["patientId"],
        },
      },
      {
        name: "analyze_biomarkers",
        description: "Analyze a set of biomarkers to identify health risks and concerning values",
        inputSchema: {
          type: "object",
          properties: {
            patientId: {
              type: "string",
              description: "The ID of the patient to analyze biomarkers for",
            },
          },
          required: ["patientId"],
        },
      },
      {
        name: "analyze_custom_biomarkers",
        description: "Analyze a custom set of biomarkers provided as input",
        inputSchema: {
          type: "object",
          properties: {
            biomarkers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                  unit: { type: "string" },
                  referenceRange: {
                    type: "object",
                    properties: {
                      min: { type: "number" },
                      max: { type: "number" }
                    },
                    required: ["min", "max"]
                  },
                  status: { type: "string", enum: ["normal", "high", "low"] }
                },
                required: ["name", "value", "unit", "referenceRange", "status"]
              },
              description: "Array of biomarker objects to analyze",
            },
          },
          required: ["biomarkers"],
        },
      },
      {
        name: "get_monitoring_priorities",
        description: "Recommend which biomarkers need closer attention and suggest monitoring priorities",
        inputSchema: {
          type: "object",
          properties: {
            patientId: {
              type: "string",
              description: "The ID of the patient to get priorities for",
            },
          },
          required: ["patientId"],
        },
      },
    ],
  };
});

/**
 * Handler that lists available resources.
 * Exposes patient data as read-only resources.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "patients://list",
        name: "Patient Directory",
        description: "A comprehensive list of all patients",
        mimeType: "application/json",
      },
      ...patients.map((p) => ({
        uri: `patients://${p.id}/biomarkers`,
        name: `${p.name}'s Biomarkers`,
        description: `Current biomarker data for ${p.name}`,
        mimeType: "application/json",
      })),
    ],
  };
});

/**
 * Handler that reads a specific resource.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "patients://list") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(patients, null, 2),
        },
      ],
    };
  }

  const biomarkerMatch = uri.match(/^patients:\/\/([^/]+)\/biomarkers$/);
  if (biomarkerMatch) {
    const patientId = biomarkerMatch[1];
    const patientBiomarkers = biomarkers.filter((b) => b.patientId === patientId);
    
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(patientBiomarkers, null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

/**
 * Handler that lists available prompts.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "patient_health_summary",
        description: "Get a detailed health summary and analysis for a patient",
        arguments: [
          {
            name: "patientId",
            description: "The ID of the patient",
            required: true,
          },
        ],
      },
    ],
  };
});

/**
 * Handler that returns a specific prompt.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "patient_health_summary") {
    const patientId = args?.patientId;
    const patient = patients.find((p) => p.id === patientId);

    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const patientBiomarkers = biomarkers.filter((b) => b.patientId === patientId);
    const analysis = analyzeBiomarkers(patientBiomarkers);
    const priorities = suggestPriorities(patientBiomarkers);

    return {
      description: `Detailed health summary for ${patient.name}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please provide a comprehensive medical overview for ${patient.name} (ID: ${patientId}). 

Here is the current data:
- Biomarkers: ${JSON.stringify(patientBiomarkers, null, 2)}
- Preliminary Analysis: ${analysis.summary}
- Risk Level: ${analysis.overallRiskLevel.toUpperCase()}
- Monitoring Priorities: ${JSON.stringify(priorities, null, 2)}

Please summarize these findings in a clear, professional way for a clinician.`,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt not found: ${name}`);
});

/**
 * Handler for the tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_patients") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(patients, null, 2),
          },
        ],
      };
    }

    if (name === "get_patient_biomarkers") {
      const patientId = args?.patientId as string;
      const patientBiomarkers = biomarkers.filter(b => b.patientId === patientId);
      
      if (patientBiomarkers.length === 0) {
        return {
          content: [{ type: "text", text: `No biomarkers found for patient ID: ${patientId}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(patientBiomarkers, null, 2),
          },
        ],
      };
    }

    if (name === "analyze_biomarkers") {
      const patientId = args?.patientId as string;
      const patientBiomarkers = biomarkers.filter(b => b.patientId === patientId);
      const patient = patients.find(p => p.id === patientId);

      if (!patient) {
        return {
          content: [{ type: "text", text: `Patient not found: ${patientId}` }],
          isError: true,
        };
      }

      if (patientBiomarkers.length === 0) {
        return {
          content: [{ type: "text", text: `No biomarkers available to analyze for patient: ${patient.name}` }],
          isError: true,
        };
      }

      const analysis = analyzeBiomarkers(patientBiomarkers);
      
      return {
        content: [
          {
            type: "text",
            text: `Analysis for ${patient.name} (ID: ${patientId}):\n\n${analysis.summary}\n\nOverall Risk Level: ${analysis.overallRiskLevel.toUpperCase()}\n\nConcerning Values:\n${JSON.stringify(analysis.concerningBiomarkers, null, 2)}`,
          },
        ],
      };
    }

    if (name === "analyze_custom_biomarkers") {
      const customBiomarkers = args?.biomarkers as any[];
      
      if (!customBiomarkers || customBiomarkers.length === 0) {
        return {
          content: [{ type: "text", text: "No biomarkers provided for analysis." }],
          isError: true,
        };
      }

      const analysis = analyzeBiomarkers(customBiomarkers);
      
      return {
        content: [
          {
            type: "text",
            text: `Custom Biomarker Analysis:\n\n${analysis.summary}\n\nOverall Risk Level: ${analysis.overallRiskLevel.toUpperCase()}\n\nConcerning Values:\n${JSON.stringify(analysis.concerningBiomarkers, null, 2)}`,
          },
        ],
      };
    }

    if (name === "get_monitoring_priorities") {
      const patientId = args?.patientId as string;
      const patientBiomarkers = biomarkers.filter(b => b.patientId === patientId);
      const patient = patients.find(p => p.id === patientId);

      if (!patient) {
        return {
          content: [{ type: "text", text: `Patient not found: ${patientId}` }],
          isError: true,
        };
      }

      if (patientBiomarkers.length === 0) {
        return {
          content: [{ type: "text", text: `No biomarkers available for patient: ${patient.name}` }],
          isError: true,
        };
      }

      const priorities = suggestPriorities(patientBiomarkers);
      
      if (priorities.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No specific monitoring priorities identified for ${patient.name}. All key biomarkers are stable and within normal ranges.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Monitoring Priorities for ${patient.name} (ID: ${patientId}):\n\n${priorities.map(p => 
              `[${p.priority.toUpperCase()}] ${p.biomarkerName}\n- Reason: ${p.reason}\n- Action: ${p.suggestedAction}`
            ).join('\n\n')}`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Health Dashboard MCP Server running on stdio");
}

main().catch(console.error);

export { server };
