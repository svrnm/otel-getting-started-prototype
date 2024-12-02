function _fibonacciRecursive(num) {
  if (num <= 1) {
    return num;
  }
  return _fibonacciRecursive(num - 1) + _fibonacciRecursive(num - 2);
}

function fibonacci(n) {
  if (n < 0) {
    const error = new Error("Input must be a non-negative integer");
    throw error;
  }
  return _fibonacciRecursive(n);
}

module.exports = { fibonacci };
