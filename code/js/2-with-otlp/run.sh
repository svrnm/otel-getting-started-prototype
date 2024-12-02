npm init -y
npm install express winston
npm install @opentelemetry/sdk-node \
            @opentelemetry/instrumentation-http \
            @opentelemetry/instrumentation-express \
            @opentelemetry/winston-transport
npm install --save @opentelemetry/exporter-trace-otlp-proto \
                   @opentelemetry/exporter-metrics-otlp-proto \
                   @opentelemetry/exporter-logs-otlp-proto
node app.js
