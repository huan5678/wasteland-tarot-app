"""
Database Query Optimization Utilities
Helpers for efficient database queries
"""

from typing import List, Optional, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload, contains_eager


class QueryOptimizer:
    """Helper class for optimizing database queries"""

    @staticmethod
    def add_eager_loading(query, model, relationships: List[str]):
        """
        Add eager loading for specified relationships

        Args:
            query: SQLAlchemy query
            model: Model class
            relationships: List of relationship names to eager load

        Returns:
            Optimized query with eager loading
        """
        for relationship in relationships:
            if hasattr(model, relationship):
                query = query.options(selectinload(getattr(model, relationship)))

        return query

    @staticmethod
    def add_joined_loading(query, model, relationships: List[str]):
        """
        Add joined loading for specified relationships
        Better for one-to-one or small one-to-many relationships

        Args:
            query: SQLAlchemy query
            model: Model class
            relationships: List of relationship names to join load

        Returns:
            Optimized query with joined loading
        """
        for relationship in relationships:
            if hasattr(model, relationship):
                query = query.options(joinedload(getattr(model, relationship)))

        return query

    @staticmethod
    def optimize_pagination(
        query,
        page: int = 1,
        page_size: int = 20,
        max_page_size: int = 100
    ):
        """
        Add optimized pagination to query

        Args:
            query: SQLAlchemy query
            page: Page number (1-indexed)
            page_size: Items per page
            max_page_size: Maximum allowed page size

        Returns:
            Tuple of (query, offset, limit)
        """
        # Validate page size
        page_size = min(page_size, max_page_size)
        page_size = max(page_size, 1)

        # Calculate offset
        offset = (page - 1) * page_size

        # Apply pagination
        paginated_query = query.offset(offset).limit(page_size)

        return paginated_query, offset, page_size

    @staticmethod
    async def count_query_results(
        db: AsyncSession,
        query
    ) -> int:
        """
        Efficiently count query results without loading all data

        Args:
            db: Database session
            query: SQLAlchemy query

        Returns:
            Count of results
        """
        # Use subquery for count
        count_query = select(func.count()).select_from(query.subquery())
        result = await db.execute(count_query)
        return result.scalar() or 0

    @staticmethod
    def add_text_search(
        query,
        model,
        search_fields: List[str],
        search_term: str
    ):
        """
        Add case-insensitive text search across multiple fields

        Args:
            query: SQLAlchemy query
            model: Model class
            search_fields: List of field names to search
            search_term: Search term

        Returns:
            Query with text search filter
        """
        from sqlalchemy import or_

        if not search_term or not search_fields:
            return query

        search_pattern = f"%{search_term}%"

        # Build OR conditions for all search fields
        search_conditions = []
        for field_name in search_fields:
            if hasattr(model, field_name):
                field = getattr(model, field_name)
                search_conditions.append(field.ilike(search_pattern))

        if search_conditions:
            query = query.where(or_(*search_conditions))

        return query

    @staticmethod
    def add_sorting(
        query,
        model,
        sort_field: str = "created_at",
        sort_order: str = "desc"
    ):
        """
        Add sorting to query

        Args:
            query: SQLAlchemy query
            model: Model class
            sort_field: Field name to sort by
            sort_order: Sort order ('asc' or 'desc')

        Returns:
            Query with sorting
        """
        from sqlalchemy import asc, desc

        if not hasattr(model, sort_field):
            sort_field = "created_at"

        field = getattr(model, sort_field)

        if sort_order.lower() == "asc":
            query = query.order_by(asc(field))
        else:
            query = query.order_by(desc(field))

        return query

    @staticmethod
    def add_date_range_filter(
        query,
        model,
        date_field: str,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None
    ):
        """
        Add date range filter to query

        Args:
            query: SQLAlchemy query
            model: Model class
            date_field: Name of date field
            start_date: Start date (inclusive)
            end_date: End date (inclusive)

        Returns:
            Query with date range filter
        """
        if not hasattr(model, date_field):
            return query

        field = getattr(model, date_field)

        if start_date:
            query = query.where(field >= start_date)

        if end_date:
            query = query.where(field <= end_date)

        return query

    @staticmethod
    def optimize_exists_check(query):
        """
        Optimize query for checking if records exist
        Returns query that only checks existence without loading data

        Args:
            query: SQLAlchemy query

        Returns:
            Optimized exists query
        """
        from sqlalchemy import exists

        return select(exists(query))

    @staticmethod
    def batch_load(
        items: List[Any],
        batch_size: int = 100
    ):
        """
        Generator for batch processing large lists

        Args:
            items: List of items to process
            batch_size: Size of each batch

        Yields:
            Batches of items
        """
        for i in range(0, len(items), batch_size):
            yield items[i:i + batch_size]


# Query performance monitoring
class QueryPerformanceMonitor:
    """Monitor query performance"""

    def __init__(self):
        self.slow_queries = []
        self.threshold_ms = 1000  # 1 second

    def log_slow_query(self, query_str: str, duration_ms: float, params: dict = None):
        """Log slow query for analysis"""
        if duration_ms > self.threshold_ms:
            self.slow_queries.append({
                "query": query_str,
                "duration_ms": duration_ms,
                "params": params,
                "timestamp": time.time()
            })

            # Keep only last 100 slow queries
            if len(self.slow_queries) > 100:
                self.slow_queries.pop(0)

    def get_slow_queries(self, limit: int = 10) -> List[dict]:
        """Get recent slow queries"""
        return sorted(
            self.slow_queries,
            key=lambda x: x["duration_ms"],
            reverse=True
        )[:limit]

    def clear(self):
        """Clear slow query log"""
        self.slow_queries.clear()


# Global performance monitor
_performance_monitor = QueryPerformanceMonitor()


def get_performance_monitor() -> QueryPerformanceMonitor:
    """Get global performance monitor instance"""
    return _performance_monitor
