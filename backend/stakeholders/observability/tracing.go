package observability

import (
    "context"
    "log"
    "os"
    "strings"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    "go.opentelemetry.io/otel/sdk/trace"
)

// Init configures global OpenTelemetry tracing with an OTLP HTTP exporter.
// It reads OTEL_EXPORTER_OTLP_ENDPOINT (defaults to http://jaeger:4318)
// and OTEL_SERVICE_NAME (defaults to "backend").
func Init(ctx context.Context) (func(context.Context) error, error) {
    endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if endpoint == "" {
        endpoint = "http://jaeger:4318"
    }
    // otlptracehttp.WithEndpoint expects host:port without scheme
    endpoint = strings.TrimPrefix(strings.TrimPrefix(endpoint, "http://"), "https://")

    exp, err := otlptracehttp.New(ctx,
        otlptracehttp.WithEndpoint(endpoint),
        otlptracehttp.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    serviceName := os.Getenv("OTEL_SERVICE_NAME")
    if serviceName == "" {
        serviceName = "backend"
    }

    res := resource.NewWithAttributes("",
        attribute.String("service.name", serviceName),
    )

    tp := trace.NewTracerProvider(
        trace.WithBatcher(exp),
        trace.WithResource(res),
    )
    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.TraceContext{})

    shutdown := func(ctx context.Context) error { return tp.Shutdown(ctx) }
    log.Printf("OpenTelemetry tracing initialized: service.name=%s endpoint=%s", serviceName, endpoint)
    return shutdown, nil
}
