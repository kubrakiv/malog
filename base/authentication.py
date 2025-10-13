"""
Custom Authentication Classes for Malog System

This module provides authentication classes that handle both regular Malog JWT tokens
and external Sovtes JWT tokens.
"""

# We'll temporarily disable the custom authentication to avoid circular imports
# and use only the standard JWT authentication
# The Sovtes authentication will be handled through dedicated endpoints