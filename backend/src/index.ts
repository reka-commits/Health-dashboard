import Koa, { type Context } from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import dotenv from "dotenv";
import { biomarkers, patients } from "./data/mockData";
import { analyzeBiomarkers, suggestPriorities } from "./mcp/analysis";
import { getClaudeResponse } from "./ai";

dotenv.config();

const app = new Koa();
const apiRouter = new Router({ prefix: "/api" });

app.use(cors());
app.use(bodyParser());

apiRouter.get("/health", (ctx: Context) => {
  ctx.body = { status: "ok" };
});

apiRouter.get("/patients", (ctx: Context) => {
  ctx.body = patients;
});

apiRouter.get("/patients/:id/biomarkers", (ctx: Context) => {
  const { id } = ctx.params;
  const { category } = ctx.query;

  let patientBiomarkers = biomarkers.filter((b) => b.patientId === id);

  if (category) {
    patientBiomarkers = patientBiomarkers.filter(
      (b) => b.category === category
    );
  }

  ctx.body = patientBiomarkers;
});

apiRouter.get("/patients/:id/analysis", async (ctx: Context) => {
  const { id } = ctx.params;
  const patientBiomarkers = biomarkers.filter((b) => b.patientId === id);
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    ctx.status = 404;
    ctx.body = { error: "Patient not found" };
    return;
  }

  if (patientBiomarkers.length === 0) {
    ctx.status = 404;
    ctx.body = { error: "No biomarkers found for this patient" };
    return;
  }

  const analysis = analyzeBiomarkers(patientBiomarkers);
  const priorities = suggestPriorities(patientBiomarkers);

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const aiResponse = await getClaudeResponse(`Analyze these biomarkers for ${patient.name}: ${JSON.stringify(patientBiomarkers)}`);
      
      if (aiResponse && aiResponse.length > 0 && 'text' in aiResponse[0]) {
        analysis.summary = aiResponse[0].text;
      }
    } else {
      console.warn("ANTHROPIC_API_KEY is not set. Using rule-based summary only.");
      analysis.summary += " (AI insights unavailable: API key not configured)";
    }
  } catch (error) {
    console.error("Failed to fetch AI insights:", error);
    analysis.summary += " (Failed to generate AI-powered insights, using rule-based analysis instead)";
  }

  ctx.body = {
    patientId: id,
    patientName: patient.name,
    analysis,
    priorities
  };
});

app.use(apiRouter.routes()).use(apiRouter.allowedMethods());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
