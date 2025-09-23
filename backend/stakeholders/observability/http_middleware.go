package observability

import (
    "net/http"
    "strconv"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/trace"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "Duration of HTTP requests in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path", "status"},
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal, httpRequestDuration)
    // Standard runtime and process collectors for Go apps
    prometheus.MustRegister(prometheus.NewGoCollector())
    prometheus.MustRegister(prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}))
}

// MetricsHandler serves Prometheus metrics.
func MetricsHandler() http.Handler { return promhttp.Handler() }

// TracingAndMetricsMiddleware wraps handlers to create a span per request and record metrics.
func TracingAndMetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        tracer := otel.Tracer("http")
        ctx, span := tracer.Start(r.Context(), r.Method+" "+r.URL.Path, trace.WithAttributes(
            attribute.String("http.method", r.Method),
            attribute.String("http.target", r.URL.Path),
        ))
        defer span.End()

        start := time.Now()
        lrw := &loggingResponseWriter{ResponseWriter: w, status: 200}
        next.ServeHTTP(lrw, r.WithContext(ctx))
        dur := time.Since(start).Seconds()

        statusStr := strconv.Itoa(lrw.status)
        labels := prometheus.Labels{"method": r.Method, "path": r.URL.Path, "status": statusStr}
        httpRequestsTotal.With(labels).Inc()
        httpRequestDuration.With(labels).Observe(dur)

        span.SetAttributes(
            attribute.Int("http.status_code", lrw.status),
            attribute.Float64("http.server_duration_s", dur),
        )
    })
}

type loggingResponseWriter struct {
    http.ResponseWriter
    status int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
    lrw.status = code
    lrw.ResponseWriter.WriteHeader(code)
}
