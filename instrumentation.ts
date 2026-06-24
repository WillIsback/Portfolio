import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerOTel } from "@vercel/otel";

export function register() {
	const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

	if (!endpoint) {
		console.warn(
			"[otel] OTEL_EXPORTER_OTLP_ENDPOINT non défini — tracing désactivé",
		);
		return;
	}

	registerOTel({
		serviceName: "portfolio",
		traceExporter: new OTLPTraceExporter({
			url: `${endpoint}/v1/traces`,
		}),
	});
}
