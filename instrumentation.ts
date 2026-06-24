import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

		if (!endpoint) {
			console.warn(
				"[otel] OTEL_EXPORTER_OTLP_ENDPOINT non défini — tracing désactivé",
			);
			return;
		}

		// OTEL_EXPORTER_OTLP_HEADERS est lu automatiquement par le SDK
		// Format Vercel : Authorization=Basic <base64>
		const sdk = new NodeSDK({
			resource: resourceFromAttributes({
				[ATTR_SERVICE_NAME]: "portfolio",
				[ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
				"deployment.environment": process.env.NODE_ENV ?? "production",
			}),
			traceExporter: new OTLPTraceExporter({
				url: `${endpoint}/v1/traces`,
			}),
			instrumentations: [
				new HttpInstrumentation(),
				new UndiciInstrumentation(),
			],
		});

		sdk.start();

		process.on("SIGTERM", () => sdk.shutdown());
	}
}
