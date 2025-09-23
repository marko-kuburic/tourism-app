package observability

import (
    "net/http"
    "strconv"
    "sync"
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

var stdRegOnce sync.Once

func init() {
    // Register app metrics, but if already registered, reuse existing collectors to avoid duplicate-registration panic.
    if err := prometheus.Register(httpRequestsTotal); err != nil {
        if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
            if cv, ok := are.ExistingCollector.(*prometheus.CounterVec); ok {
                httpRequestsTotal = cv
            }
        }
    }
    if err := prometheus.Register(httpRequestDuration); err != nil {
        if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
            if hv, ok := are.ExistingCollector.(*prometheus.HistogramVec); ok {
                httpRequestDuration = hv
            }
        }
    }
    // Standard runtime and process collectors for Go apps (register exactly once)
    stdRegOnce.Do(func() {
        _ = prometheus.Register(prometheus.NewGoCollector())
        _ = prometheus.Register(prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}))
    })
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
