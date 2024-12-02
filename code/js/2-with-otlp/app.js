const { NodeSDK } = require("@opentelemetry/sdk-node");
const { SimpleLogRecordProcessor } = require("@opentelemetry/sdk-logs");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const {
  OpenTelemetryTransportV3,
} = require("@opentelemetry/winston-transport");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");

const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-proto");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");
const {
  OTLPMetricExporter,
} = require("@opentelemetry/exporter-metrics-otlp-proto");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
  serviceName: "fibonacci-server",
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  logRecordProcessors: [new SimpleLogRecordProcessor(new OTLPLogExporter())],
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});
sdk.start();

const express = require("express");
const winston = require("winston");
const { fibonacci } = require("./lib.js");

const logger = winston.createLogger({
  level: "info",
  transports: [new OpenTelemetryTransportV3()],
});

const app = express();
const port = process.env.APPLICATION_PORT || 8080;

app.get("/fibonacci", (req, res) => {
  const n = parseInt(req.query.n, 10);

  if (isNaN(n)) {
    const errorMessage = "Invalid input: 'n' must be a number";
    logger.warn(errorMessage);
    return res.status(400).json({ status: "error", message: errorMessage });
  }

  try {
    const result = fibonacci(n);
    logger.debug(`Fibonacci computation successful: fib(${n}) = ${result}`);
    logger.info(`Request successful: fib(${n})`);
    res.status(200).json({ status: "ok", n, result });
  } catch (error) {
    logger.error(
      `Internal server error during Fibonacci computation: ${error.message}`,
    );
    res.sendStatus(500);
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
