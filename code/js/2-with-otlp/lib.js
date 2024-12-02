const { trace, metrics } = require("@opentelemetry/api");

// Initialize a meter for metrics
const meter = metrics.getMeter("fibonacci-meter");
const callCounter = meter.createCounter("fibonacci_function_calls", {
  description: "Counts the number of times the fibonacci function is called",
});
const tracer = trace.getTracer("fibonacci-tracer");

function _fibonacciRecursive(num) {
  const outerSpan = tracer.startSpan("_fibonacciRecursive", {
    attributes: { input: num },
  });
  if (num <= 1) {
    return num;
  }
  return _fibonacciRecursive(num - 1) + _fibonacciRecursive(num - 2);
}

function fibonacci(n) {
  const outerSpan = tracer.startSpan("fibonacci_outer", {
    attributes: { input: n },
  });

  callCounter.add(1);
  if (n < 0) {
    const error = new Error("Input must be a non-negative integer");
    outerSpan.recordException(error);
    throw error;
  }
  return _fibonacciRecursive(n);
}

module.exports = { fibonacci };
