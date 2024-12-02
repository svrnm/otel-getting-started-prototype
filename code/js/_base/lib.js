#ifdef ADD_REMOTE_COMPUTATION
const axios = require("axios");
#endif

#ifdef ADD_BASE_INSTRUMENTATION
const { trace, metrics } = require('@opentelemetry/api');

// Initialize a meter for metrics
const meter = metrics.getMeter('fibonacci-meter');
const callCounter = meter.createCounter('fibonacci_function_calls', {
  description: 'Counts the number of times the fibonacci function is called',
});
const tracer = trace.getTracer('fibonacci-tracer');
#endif

function _fibonacciRecursive(num) {
  #ifdef ADD_BASE_INSTRUMENTATION
  const outerSpan = tracer.startSpan('_fibonacciRecursive', {
    attributes: { input: num },
  });
#endif
  if (num <= 1) {
    return num;
  }
  return _fibonacciRecursive(num - 1) + _fibonacciRecursive(num - 2);
}

#ifdef ADD_REMOTE_COMPUTATION
async function fibonacci(n, leftRemoteService, rightRemoteService) {
  const outerSpan = tracer.startSpan('fibonacci_outer', {
    attributes: { input: n },
  });

  callCounter.add(1);

  if (n < 0) {
    const error = new Error("Input must be a non-negative integer");
    #ifdef ADD_BASE_INSTRUMENTATION
    outerSpan.recordException(error);
    #endif
    throw error
  }

  if (!leftRemoteService || !rightRemoteService) {
    return _fibonacciRecursive(n);
  }

  return await remoteFibonacci(n, leftRemoteService, rightRemoteService);
}

async function remoteFibonacci(n, leftRemoteService, rightRemoteService) {
  if (n <= 1) return n;

  try {
    const [leftResponse, rightResponse] = await Promise.all([
      axios.get(`${leftRemoteService}/fibonacci?n=${n - 1}`),
      axios.get(`${rightRemoteService}/fibonacci?n=${n - 2}`),
    ]);

    return leftResponse.data.result + rightResponse.data.result;
  } catch (error) {
    throw new Error("Error in remote Fibonacci computation: " + error.message);
  }
}

#else
function fibonacci(n) {
#ifdef ADD_BASE_INSTRUMENTATION
  const outerSpan = tracer.startSpan('fibonacci_outer', {
    attributes: { input: n },
  });

  callCounter.add(1);
#endif
  if (n < 0) {
    const error = new Error("Input must be a non-negative integer");
    #ifdef ADD_BASE_INSTRUMENTATION
    outerSpan.recordException(error);
    #endif
    throw error
  }
  return _fibonacciRecursive(n);
}
#endif

module.exports = { fibonacci };
