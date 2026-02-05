"""Shared enums and simple types used across packages."""

from enum import Enum


class SurfaceType(str, Enum):
    """Surface types for different UI contexts in the Segrada ecosystem.

    These represent the different "surfaces" or contexts where Glyph
    and other features can appear.
    """

    FOCUS_DOCK = "focus_dock"
    OUTORA_LIBRARY = "outora_library"
    SIDEGLYPH = "sideglyph"
    MOBILE = "mobile"
    OTHER = "other"


class Environment(str, Enum):
    """Application environment types."""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TEST = "test"
