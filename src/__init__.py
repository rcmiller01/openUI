"""Open-Deep-Coder: A multi-agent coding workflow.

This package implements a graph-of-agents for software work,
reusing the research pattern (plan → act → observe → critique → iterate)
but with coding tools and code-quality gates.
"""

__version__ = "0.1.0"
__author__ = "rcmiller01"

from .math_ops import (
    add,
    divide,
    factorial,
    is_prime,
    multiply,
    power,
    subtract,
)

__all__ = [
    "add",
    "divide",
    "factorial",
    "is_prime",
    "multiply",
    "power",
    "subtract",
]