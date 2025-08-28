"""Mathematical operations module.

This module provides basic mathematical operations as an example
of the Open-Deep-Coder workflow implementation.
"""

from typing import Union

Number = Union[int, float]


def add(a: Number, b: Number) -> Number:
    """Add two numbers.
    
    Args:
        a: First number
        b: Second number
        
    Returns:
        Sum of a and b
        
    Examples:
        >>> add(2, 3)
        5
        >>> add(2.5, 1.5)
        4.0
    """
    return a + b


def subtract(a: Number, b: Number) -> Number:
    """Subtract two numbers.
    
    Args:
        a: First number
        b: Second number
        
    Returns:
        Difference of a and b
        
    Examples:
        >>> subtract(5, 3)
        2
        >>> subtract(2.5, 1.5)
        1.0
    """
    return a - b


def multiply(a: Number, b: Number) -> Number:
    """Multiply two numbers.
    
    Args:
        a: First number
        b: Second number
        
    Returns:
        Product of a and b
        
    Examples:
        >>> multiply(2, 3)
        6
        >>> multiply(2.5, 2)
        5.0
    """
    return a * b


def divide(a: Number, b: Number) -> float:
    """Divide two numbers.
    
    Args:
        a: Dividend
        b: Divisor
        
    Returns:
        Quotient of a and b
        
    Raises:
        ZeroDivisionError: If b is zero
        
    Examples:
        >>> divide(6, 2)
        3.0
        >>> divide(5, 2)
        2.5
    """
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b


def power(base: Number, exponent: Number) -> Number:
    """Raise base to the power of exponent.
    
    Args:
        base: Base number
        exponent: Exponent
        
    Returns:
        base raised to the power of exponent
        
    Examples:
        >>> power(2, 3)
        8
        >>> power(4, 0.5)
        2.0
    """
    return base ** exponent


def factorial(n: int) -> int:
    """Calculate factorial of a non-negative integer.
    
    Args:
        n: Non-negative integer
        
    Returns:
        Factorial of n
        
    Raises:
        ValueError: If n is negative
        TypeError: If n is not an integer
        
    Examples:
        >>> factorial(5)
        120
        >>> factorial(0)
        1
    """
    if not isinstance(n, int):
        raise TypeError("Factorial is only defined for integers")
    if n < 0:
        raise ValueError("Factorial is only defined for non-negative integers")
    
    if n == 0 or n == 1:
        return 1
    
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


def is_prime(n: int) -> bool:
    """Check if a number is prime.
    
    Args:
        n: Integer to check
        
    Returns:
        True if n is prime, False otherwise
        
    Raises:
        TypeError: If n is not an integer
        
    Examples:
        >>> is_prime(7)
        True
        >>> is_prime(4)
        False
        >>> is_prime(2)
        True
    """
    if not isinstance(n, int):
        raise TypeError("Prime check is only defined for integers")
    
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    
    # Check odd divisors up to sqrt(n)
    for i in range(3, int(n**0.5) + 1, 2):
        if n % i == 0:
            return False
    return True