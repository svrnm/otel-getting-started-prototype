package main

import "fmt"

// Calculate computes the nth Fibonacci number
func fibonacci(n int) (int, error) {
	if n < 0 {
		return 0, fmt.Errorf("input must be a non-negative integer")
	}
	return fibonacciRecursive(n), nil
}

func fibonacciRecursive(n int) int {
	if n <= 1 {
		return n
	}
	return fibonacciRecursive(n-1) + fibonacciRecursive(n-2)
}
