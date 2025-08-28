"""Tests for math_ops module."""

import pytest
from src.math_ops import (
    add,
    divide,
    factorial,
    is_prime,
    multiply,
    power,
    subtract,
)


class TestAdd:
    """Test cases for the add function."""

    def test_add_positive_integers(self):
        """Test adding positive integers."""
        assert add(2, 3) == 5
        assert add(10, 20) == 30

    def test_add_negative_integers(self):
        """Test adding negative integers."""
        assert add(-2, -3) == -5
        assert add(-10, 5) == -5

    def test_add_floats(self):
        """Test adding floating point numbers."""
        assert add(2.5, 1.5) == 4.0
        assert add(1.1, 2.2) == pytest.approx(3.3)

    def test_add_mixed_types(self):
        """Test adding integer and float."""
        assert add(2, 1.5) == 3.5
        assert add(3.5, 2) == 5.5

    def test_add_zero(self):
        """Test adding zero."""
        assert add(5, 0) == 5
        assert add(0, 5) == 5
        assert add(0, 0) == 0


class TestSubtract:
    """Test cases for the subtract function."""

    def test_subtract_positive_integers(self):
        """Test subtracting positive integers."""
        assert subtract(5, 3) == 2
        assert subtract(10, 4) == 6

    def test_subtract_negative_result(self):
        """Test subtraction resulting in negative number."""
        assert subtract(3, 5) == -2
        assert subtract(-5, -3) == -2

    def test_subtract_floats(self):
        """Test subtracting floating point numbers."""
        assert subtract(2.5, 1.5) == 1.0
        assert subtract(3.7, 1.2) == pytest.approx(2.5)

    def test_subtract_zero(self):
        """Test subtracting zero."""
        assert subtract(5, 0) == 5
        assert subtract(0, 5) == -5


class TestMultiply:
    """Test cases for the multiply function."""

    def test_multiply_positive_integers(self):
        """Test multiplying positive integers."""
        assert multiply(2, 3) == 6
        assert multiply(4, 5) == 20

    def test_multiply_negative_integers(self):
        """Test multiplying negative integers."""
        assert multiply(-2, 3) == -6
        assert multiply(-2, -3) == 6

    def test_multiply_floats(self):
        """Test multiplying floating point numbers."""
        assert multiply(2.5, 2) == 5.0
        assert multiply(1.5, 2.5) == pytest.approx(3.75)

    def test_multiply_by_zero(self):
        """Test multiplying by zero."""
        assert multiply(5, 0) == 0
        assert multiply(0, 5) == 0
        assert multiply(0, 0) == 0

    def test_multiply_by_one(self):
        """Test multiplying by one."""
        assert multiply(5, 1) == 5
        assert multiply(1, 5) == 5


class TestDivide:
    """Test cases for the divide function."""

    def test_divide_positive_integers(self):
        """Test dividing positive integers."""
        assert divide(6, 2) == 3.0
        assert divide(10, 4) == 2.5

    def test_divide_negative_integers(self):
        """Test dividing negative integers."""
        assert divide(-6, 2) == -3.0
        assert divide(-6, -2) == 3.0

    def test_divide_floats(self):
        """Test dividing floating point numbers."""
        assert divide(5.0, 2.0) == 2.5
        assert divide(7.5, 2.5) == 3.0

    def test_divide_by_zero(self):
        """Test dividing by zero raises ZeroDivisionError."""
        with pytest.raises(ZeroDivisionError, match="Cannot divide by zero"):
            divide(5, 0)

    def test_divide_zero_by_number(self):
        """Test dividing zero by a number."""
        assert divide(0, 5) == 0.0
        assert divide(0, 2.5) == 0.0


class TestPower:
    """Test cases for the power function."""

    def test_power_positive_integers(self):
        """Test raising positive integers to powers."""
        assert power(2, 3) == 8
        assert power(3, 2) == 9
        assert power(5, 0) == 1

    def test_power_negative_base(self):
        """Test raising negative base to powers."""
        assert power(-2, 2) == 4
        assert power(-2, 3) == -8

    def test_power_fractional_exponent(self):
        """Test raising to fractional powers."""
        assert power(4, 0.5) == 2.0
        assert power(8, 1/3) == pytest.approx(2.0)

    def test_power_zero_base(self):
        """Test raising zero to powers."""
        assert power(0, 5) == 0
        assert power(0, 2.5) == 0

    def test_power_one_base(self):
        """Test raising one to powers."""
        assert power(1, 5) == 1
        assert power(1, 100) == 1


class TestFactorial:
    """Test cases for the factorial function."""

    def test_factorial_positive_integers(self):
        """Test factorial of positive integers."""
        assert factorial(0) == 1
        assert factorial(1) == 1
        assert factorial(5) == 120
        assert factorial(6) == 720

    def test_factorial_negative_number(self):
        """Test factorial of negative number raises ValueError."""
        with pytest.raises(ValueError, match="non-negative integers"):
            factorial(-1)
        with pytest.raises(ValueError, match="non-negative integers"):
            factorial(-5)

    def test_factorial_non_integer(self):
        """Test factorial of non-integer raises TypeError."""
        with pytest.raises(TypeError, match="only defined for integers"):
            factorial(2.5)
        with pytest.raises(TypeError, match="only defined for integers"):
            factorial("5")

    def test_factorial_large_number(self):
        """Test factorial of larger numbers."""
        assert factorial(10) == 3628800


class TestIsPrime:
    """Test cases for the is_prime function."""

    def test_is_prime_small_primes(self):
        """Test small prime numbers."""
        assert is_prime(2) is True
        assert is_prime(3) is True
        assert is_prime(5) is True
        assert is_prime(7) is True
        assert is_prime(11) is True

    def test_is_prime_small_composites(self):
        """Test small composite numbers."""
        assert is_prime(4) is False
        assert is_prime(6) is False
        assert is_prime(8) is False
        assert is_prime(9) is False
        assert is_prime(10) is False

    def test_is_prime_edge_cases(self):
        """Test edge cases."""
        assert is_prime(0) is False
        assert is_prime(1) is False
        assert is_prime(-5) is False

    def test_is_prime_larger_numbers(self):
        """Test larger prime and composite numbers."""
        assert is_prime(97) is True  # Large prime
        assert is_prime(100) is False  # Large composite
        assert is_prime(101) is True  # Large prime

    def test_is_prime_non_integer(self):
        """Test is_prime with non-integer raises TypeError."""
        with pytest.raises(TypeError, match="only defined for integers"):
            is_prime(2.5)
        with pytest.raises(TypeError, match="only defined for integers"):
            is_prime("7")


# Integration tests
class TestMathOpsIntegration:
    """Integration tests combining multiple operations."""

    def test_combined_operations(self):
        """Test combinations of mathematical operations."""
        # (2 + 3) * 4 = 20
        result = multiply(add(2, 3), 4)
        assert result == 20

        # 10 / (5 - 3) = 5.0
        result = divide(10, subtract(5, 3))
        assert result == 5.0

        # 2^3 + factorial(3) = 8 + 6 = 14
        result = add(power(2, 3), factorial(3))
        assert result == 14

    def test_error_propagation(self):
        """Test that errors propagate correctly in combined operations."""
        # Division by zero in combined operation
        with pytest.raises(ZeroDivisionError):
            divide(10, subtract(5, 5))

        # Type error in combined operation
        with pytest.raises(TypeError):
            add(factorial(2.5), 5)


# Performance tests (marked as slow)
@pytest.mark.slow
class TestMathOpsPerformance:
    """Performance tests for math operations."""

    def test_factorial_performance(self):
        """Test factorial performance with larger numbers."""
        # This should complete reasonably quickly
        result = factorial(20)
        assert result == 2432902008176640000

    def test_is_prime_performance(self):
        """Test is_prime performance with larger numbers."""
        # Test with a known large prime
        assert is_prime(7919) is True
        # Test with a known large composite
        assert is_prime(7920) is False