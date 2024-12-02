
#ifdef ADD_BASE_INSTRUMENTATION
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
const { OpenTelemetryTransportV3 } = require('@opentelemetry/winston-transport');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

#ifdef ADD_OTLP_EXPORTERS
const { OTLPLogExporter } =  require('@opentelemetry/exporter-logs-otlp-proto');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
#else
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics');
const { ConsoleLogRecordExporter } = require('@opentelemetry/sdk-logs');
#endif

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
#ifndef ADD_REMOTE_COMPUTATION
  serviceName: 'fibonacci-server',
#endif
#ifdef ADD_OTLP_EXPORTERS
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter()
  }),
  logRecordProcessors: [
    new SimpleLogRecordProcessor(new OTLPLogExporter()),
  ],
#else
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter()
  }),
  logRecordProcessors: [
     new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
  ],
#endif
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});
sdk.start()
#endif 

const express = require("express");
const winston = require("winston");
const { fibonacci } = require("./lib.js");

const logger = winston.createLogger({
  level: "info",
  transports: [
#ifndef ADD_BASE_INSTRUMENTATION
    new winston.transports.Console()
#else
    new OpenTelemetryTransportV3()
#endif
  ],
});

const app = express();
const port = process.env.APPLICATION_PORT || 8080;
#ifdef ADD_REMOTE_COMPUTATION
const leftRemoteService = process.env.LEFT_REMOTE_SERVICE;
const rightRemoteService = process.env.RIGHT_REMOTE_SERVICE;
#endif

#ifdef ADD_REMOTE_COMPUTATION
app.get("/fibonacci", async (req, res) => {
#else
app.get("/fibonacci", (req, res) => {
#endif
  const n = parseInt(req.query.n, 10);

  if (isNaN(n)) {
    const errorMessage = "Invalid input: 'n' must be a number";
    logger.warn(errorMessage);
    return res.status(400).json({ status: "error", message: errorMessage });
  }

  try {
#ifdef ADD_REMOTE_COMPUTATION
    const result = await fibonacci(n, leftRemoteService, rightRemoteService);
#else
    const result = fibonacci(n);
#endif
    logger.debug(`Fibonacci computation successful: fib(${n}) = ${result}`);
    logger.info(`Request successful: fib(${n})`);
    res.status(200).json({ status: "ok", n, result });
  } catch (error) {
    logger.error(`Internal server error during Fibonacci computation: ${error.message}`);
    res.sendStatus(500);
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
