"""
WebAuthn Credential Model
Represents a Passkey/FIDO2 credential for passwordless authentication.
"""

from sqlalchemy import Column, String, BigInteger, Boolean, TIMESTAMP, ForeignKey, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, BYTEA
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from typing import Optional, List
from datetime import datetime

from app.models.base import Base


class Credential(Base):
    """
    WebAuthn Credential (Passkey) Model

    Stores FIDO2 credentials for passwordless authentication.
    Each user can have multiple credentials (e.g., Touch ID on MacBook,
    Windows Hello on PC, hardware security key).

    Reference: docs/passkeys-architecture.md Section 3.1.2
    """

    __tablename__ = "credentials"
    __table_args__ = {'comment': 'WebAuthn credentials (Passkeys) for passwordless authentication'}

    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
        comment="Primary key"
    )

    # Foreign key to users
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Foreign key to users table"
    )

    # WebAuthn credential data
    credential_id = Column(
        Text,
        unique=True,
        nullable=False,
        index=True,
        comment="WebAuthn credential ID (Base64URL encoded)"
    )

    public_key = Column(
        Text,
        nullable=False,
        comment="Public key (CBOR encoded)"
    )

    # Security counters
    counter = Column(
        BigInteger,
        nullable=False,
        default=0,
        server_default='0',
        comment="Signature counter for replay protection"
    )

    # Device information
    transports = Column(
        ARRAY(Text),
        nullable=True,
        comment="Supported transports: usb, nfc, ble, internal"
    )

    device_name = Column(
        Text,
        nullable=True,
        comment="User-friendly device name (e.g., 'MacBook Touch ID')"
    )

    aaguid = Column(
        UUID(as_uuid=True),
        nullable=True,
        comment="Authenticator AAGUID (Authenticator Attestation GUID)"
    )

    # Backup state (for passkey sync, e.g., iCloud Keychain)
    backup_eligible = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default='false',
        comment="Whether credential is backup eligible"
    )

    backup_state = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default='false',
        comment="Whether credential is currently backed up"
    )

    # Timestamps
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        comment="Credential creation timestamp"
    )

    last_used_at = Column(
        TIMESTAMP,
        nullable=True,
        comment="Last successful authentication timestamp"
    )

    # Relationship to User
    user = relationship(
        "User",
        back_populates="credentials",
        foreign_keys=[user_id]
    )

    def __repr__(self) -> str:
        return (
            f"<Credential(id={self.id}, "
            f"user_id={self.user_id}, "
            f"device_name='{self.device_name}', "
            f"created_at={self.created_at})>"
        )

    def to_dict(self) -> dict:
        """
        Convert credential to dictionary (for API responses).
        Excludes sensitive data like public_key.
        """
        return {
            "id": str(self.id),
            "credential_id": self.credential_id[:20] + "..." if self.credential_id else None,  # Truncate for security
            "device_name": self.device_name,
            "transports": self.transports,
            "backup_eligible": self.backup_eligible,
            "backup_state": self.backup_state,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
        }

    def update_last_used(self) -> None:
        """Update the last_used_at timestamp."""
        self.last_used_at = datetime.utcnow()

    def increment_counter(self, new_counter: int) -> bool:
        """
        Update the signature counter.

        Args:
            new_counter: The new counter value from the authenticator

        Returns:
            True if counter was successfully incremented, False if counter regression detected

        Raises:
            ValueError: If new_counter is less than current counter (possible replay attack)
        """
        if new_counter <= self.counter:
            # Counter regression - possible replay attack!
            raise ValueError(
                f"Counter regression detected! Current: {self.counter}, New: {new_counter}. "
                f"This may indicate a cloned credential or replay attack."
            )

        self.counter = new_counter
        return True

    @property
    def is_platform_authenticator(self) -> bool:
        """Check if this is a platform authenticator (e.g., Touch ID, Windows Hello)."""
        return self.transports is not None and 'internal' in self.transports

    @property
    def is_roaming_authenticator(self) -> bool:
        """Check if this is a roaming authenticator (e.g., hardware security key)."""
        return self.transports is not None and any(
            t in self.transports for t in ['usb', 'nfc', 'ble']
        )
