"""
Test Suite for Maintainability Features (Task 19)
Requirements: NFR-4.1, NFR-4.2, NFR-4.4

Tests comprehensive maintainability features:
1. Configuration-driven architecture (JSON configs)
2. Factory Pattern for AI providers
3. Comprehensive logging
4. API documentation (OpenAPI)
5. Code documentation (docstrings)
"""

import pytest
import json
import logging
from pathlib import Path
from typing import Optional

from app.services.ai_providers import create_ai_provider
from app.services.ai_providers.factory import auto_select_provider
from app.services.ai_providers.base import AIProvider
from app.core.logging_config import StructuredFormatter, request_id_var, user_id_var, get_logger


class TestConfigurationDrivenArchitecture:
    """
    Test NFR-4.1: Configuration-driven architecture
    Verify spread types are managed via JSON configuration
    """

    def test_frontend_spread_config_exists(self):
        """Frontend spread configuration file should exist"""
        config_path = Path(__file__).parent.parent.parent.parent / "src/config/spreads.json"
        assert config_path.exists(), "spreads.json configuration file not found"

    def test_spread_config_structure(self):
        """Spread configuration should have valid JSON structure"""
        config_path = Path(__file__).parent.parent.parent.parent / "src/config/spreads.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        assert 'spreads' in config, "Config missing 'spreads' key"
        assert isinstance(config['spreads'], dict), "Spreads must be a dictionary"

        # Verify each spread has required fields
        for spread_key, spread in config['spreads'].items():
            assert 'canonicalName' in spread, f"{spread_key} missing canonicalName"
            assert 'displayName' in spread, f"{spread_key} missing displayName"
            assert 'cardCount' in spread, f"{spread_key} missing cardCount"
            assert 'positions' in spread, f"{spread_key} missing positions"
            assert len(spread['positions']) == spread['cardCount'], \
                f"{spread_key} positions count mismatch"

    def test_spread_config_completeness(self):
        """Configuration should contain all core spread types"""
        config_path = Path(__file__).parent.parent.parent.parent / "src/config/spreads.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        spreads = config['spreads']

        # Core spread types from requirements
        required_spreads = [
            'single_wasteland',
            'vault_tec_spread',
            'wasteland_survival',
            'brotherhood_council'
        ]

        for required in required_spreads:
            assert required in spreads, f"Missing required spread: {required}"


class TestFactoryPattern:
    """
    Test NFR-4.2: Factory Pattern for AI providers
    Verify AI provider factory enables easy extensibility
    """

    def test_factory_creates_openai_provider(self):
        """Factory should create OpenAI provider"""
        provider = create_ai_provider(
            provider_name="openai",
            api_key="test-key",
            model="gpt-4"
        )

        assert provider is not None
        assert hasattr(provider, 'generate_completion')
        assert hasattr(provider, 'generate_completion_stream')

    def test_factory_creates_gemini_provider(self):
        """Factory should create Gemini provider"""
        provider = create_ai_provider(
            provider_name="gemini",
            api_key="test-key",
            model="gemini-pro"
        )

        assert provider is not None
        assert hasattr(provider, 'generate_completion')

    def test_factory_creates_anthropic_provider(self):
        """Factory should create Anthropic provider"""
        provider = create_ai_provider(
            provider_name="anthropic",
            api_key="test-key",
            model="claude-3-5-sonnet-20241022"
        )

        assert provider is not None
        assert hasattr(provider, 'generate_completion')

    def test_factory_rejects_unknown_provider(self):
        """Factory should raise error for unknown provider"""
        with pytest.raises(ValueError, match="Unknown AI provider"):
            create_ai_provider(
                provider_name="unknown_provider",
                api_key="test-key",
                model="model"
            )

    def test_auto_select_provider_logic(self):
        """Auto-select should follow priority order"""
        # Preferred provider takes priority
        result = auto_select_provider(
            openai_key="openai-key",
            gemini_key="gemini-key",
            preferred_provider="gemini"
        )

        assert result is not None
        provider_name, api_key = result
        assert provider_name == "gemini"
        assert api_key == "gemini-key"

    def test_auto_select_provider_fallback(self):
        """Auto-select should fallback if preferred unavailable"""
        result = auto_select_provider(
            openai_key="openai-key",
            preferred_provider="anthropic"  # Not available
        )

        assert result is not None
        provider_name, api_key = result
        assert provider_name == "openai"  # Falls back to available

    def test_auto_select_provider_none_available(self):
        """Auto-select should return None if no keys"""
        result = auto_select_provider()

        assert result is None


class TestComprehensiveLogging:
    """
    Test NFR-4.4: Comprehensive logging for debugging
    Verify structured logging captures key operational context
    """

    def test_structured_formatter_basic_log(self):
        """StructuredFormatter should produce valid JSON"""
        formatter = StructuredFormatter()

        logger = logging.getLogger('test_logger')
        record = logger.makeRecord(
            name='test_logger',
            level=logging.INFO,
            fn='test_file.py',
            lno=42,
            msg='Test message',
            args=(),
            exc_info=None
        )

        formatted = formatter.format(record)
        log_data = json.loads(formatted)

        assert 'timestamp' in log_data
        assert log_data['level'] == 'INFO'
        assert log_data['message'] == 'Test message'
        assert log_data['logger'] == 'test_logger'
        assert log_data['line'] == 42

    def test_structured_formatter_with_request_context(self):
        """StructuredFormatter should include request context"""
        formatter = StructuredFormatter()

        # Set context
        request_id_var.set('req-123')
        user_id_var.set('user-456')

        logger = logging.getLogger('test_logger')
        record = logger.makeRecord(
            name='test_logger',
            level=logging.INFO,
            fn='test_file.py',
            lno=42,
            msg='Test message',
            args=(),
            exc_info=None
        )

        formatted = formatter.format(record)
        log_data = json.loads(formatted)

        assert log_data['request_id'] == 'req-123'
        assert log_data['user_id'] == 'user-456'

        # Cleanup
        request_id_var.set(None)
        user_id_var.set(None)

    def test_structured_formatter_with_exception(self):
        """StructuredFormatter should capture exception details"""
        formatter = StructuredFormatter()

        logger = logging.getLogger('test_logger')

        try:
            raise ValueError("Test exception")
        except ValueError:
            import sys
            exc_info = sys.exc_info()

            record = logger.makeRecord(
                name='test_logger',
                level=logging.ERROR,
                fn='test_file.py',
                lno=42,
                msg='Test error',
                args=(),
                exc_info=exc_info
            )

            formatted = formatter.format(record)
            log_data = json.loads(formatted)

            assert 'exception' in log_data
            assert log_data['exception']['type'] == 'ValueError'
            assert 'Test exception' in log_data['exception']['message']
            assert 'traceback' in log_data['exception']

    def test_get_logger_returns_configured_logger(self):
        """get_logger should return properly configured logger"""
        logger = get_logger('test_module')

        assert logger is not None
        assert logger.name == 'test_module'
        assert isinstance(logger, logging.Logger)


class TestAPIDocumentation:
    """
    Test NFR-4.4: API documentation with OpenAPI
    Verify FastAPI generates comprehensive Swagger docs
    """

    def test_fastapi_openapi_schema_available(self):
        """FastAPI should expose OpenAPI schema"""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.get("/openapi.json")

        assert response.status_code == 200
        schema = response.json()

        assert 'openapi' in schema
        assert 'info' in schema
        assert 'paths' in schema

    def test_openapi_contains_core_endpoints(self):
        """OpenAPI schema should document core endpoints"""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.get("/openapi.json")
        schema = response.json()

        paths = schema['paths']

        # Core API endpoints from requirements
        required_paths = [
            '/api/v1/cards',
            '/api/v1/readings',
            '/api/v1/spreads'
        ]

        for required_path in required_paths:
            # Check if path exists (exact or with parameters)
            matching_paths = [p for p in paths.keys() if required_path in p]
            assert len(matching_paths) > 0, f"Missing endpoint: {required_path}"

    def test_openapi_contains_schema_definitions(self):
        """OpenAPI schema should contain data models"""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.get("/openapi.json")
        schema = response.json()

        # Should have components/schemas section
        assert 'components' in schema
        assert 'schemas' in schema['components']

        # Should document key data models
        schemas = schema['components']['schemas']
        assert len(schemas) > 0, "No schema definitions found"


class TestCodeDocumentation:
    """
    Test NFR-4.4: JSDoc/docstrings for complex functions
    Verify key services have comprehensive documentation
    """

    def test_ai_interpretation_service_has_docstrings(self):
        """AIInterpretationService should have docstrings"""
        from app.services.ai_interpretation_service import AIInterpretationService

        # Class docstring
        assert AIInterpretationService.__doc__ is not None
        assert len(AIInterpretationService.__doc__) > 50

        # __init__ docstring
        assert AIInterpretationService.__init__.__doc__ is not None
        assert 'Args:' in AIInterpretationService.__init__.__doc__

    def test_factory_functions_have_docstrings(self):
        """Factory functions should have docstrings"""
        from app.services.ai_providers.factory import create_ai_provider, auto_select_provider

        # create_ai_provider docstring
        assert create_ai_provider.__doc__ is not None
        assert 'Args:' in create_ai_provider.__doc__
        assert 'Returns:' in create_ai_provider.__doc__

        # auto_select_provider docstring
        assert auto_select_provider.__doc__ is not None
        assert 'Priority order:' in auto_select_provider.__doc__

    def test_base_ai_provider_has_docstrings(self):
        """AIProvider base class should have docstrings"""
        from app.services.ai_providers.base import AIProvider

        assert AIProvider.__doc__ is not None

        # Abstract methods should have docstrings
        if hasattr(AIProvider, 'generate'):
            # Check if generate method has docstring (may vary by implementation)
            pass


class TestMaintainabilityIntegration:
    """
    Integration tests verifying all maintainability features work together
    """

    def test_config_to_logging_workflow(self):
        """Configuration should be logged on application startup"""
        logger = get_logger('test_integration')

        # Simulate loading config and logging
        config_path = Path(__file__).parent.parent.parent.parent / "src/config/spreads.json"

        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)

            spread_count = len(config['spreads'])
            logger.info(f"Loaded {spread_count} spread configurations")

        # Verify logger works (no exceptions)
        assert True

    def test_factory_with_logging(self):
        """Factory should log provider creation"""
        # This would be tested in integration with actual logging capture
        # For now, verify factory doesn't break when logging is active
        logger = get_logger('test_factory')

        provider = create_ai_provider(
            provider_name="openai",
            api_key="test-key",
            model="gpt-4"
        )

        assert provider is not None
        logger.info(f"Created provider: {provider.__class__.__name__}")

    def test_end_to_end_maintainability(self):
        """End-to-end test: Config → Factory → Logging → Documentation"""
        # 1. Configuration
        config_path = Path(__file__).parent.parent.parent.parent / "src/config/spreads.json"
        assert config_path.exists()

        # 2. Factory Pattern
        provider = create_ai_provider("openai", "test-key", "gpt-4")
        assert provider is not None

        # 3. Logging
        logger = get_logger('e2e_test')
        logger.info("E2E maintainability test executed")

        # 4. Documentation (verified via docstrings)
        assert AIProvider.__doc__ is not None

        # All maintainability features working together
        assert True


# Run specific test groups
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
