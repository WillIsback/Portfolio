import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

export async function register() {
  // Uniquement côté serveur Node.js (pas dans le runtime Edge de Next.js)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    if (!endpoint) {
      console.warn("[otel] OTEL_EXPORTER_OTLP_ENDPOINT non défini — tracing désactivé");
      return;
    }

    const authHeader = process.env.OTEL_EXPORTER_OTLP_AUTH_HEADER;

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "portfolio",
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
        "deployment.environment": process.env.NODE_ENV ?? "production",
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${endpoint}/v1/traces`,
        headers: authHeader ? { Authorization: authHeader } : {},
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Désactive le file system (trop verbeux)
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();

    process.on("SIGTERM", () => sdk.shutdown());
  }
}
