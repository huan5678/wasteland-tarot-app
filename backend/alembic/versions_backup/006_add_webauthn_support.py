"""Add WebAuthn/Passkeys support

Revision ID: 006
Revises: 005
Create Date: 2025-10-03

This migration adds support for WebAuthn/FIDO2 Passkeys authentication:
1. Adds webauthn_user_handle to users table
2. Creates credentials table for storing Passkey credentials
3. Creates indexes for efficient queries

Reference: docs/passkeys-architecture.md
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005_oauth_support'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add WebAuthn support to the database schema.
    """
    # 1. Add webauthn_user_handle to users table
    op.add_column(
        'users',
        sa.Column(
            'webauthn_user_handle',
            postgresql.BYTEA(),
            nullable=True,
            comment='WebAuthn user handle for usernameless authentication (64 bytes)'
        )
    )

    # Create unique index on webauthn_user_handle
    op.create_index(
        'idx_users_webauthn_handle',
        'users',
        ['webauthn_user_handle'],
        unique=True,
        postgresql_where=sa.text('webauthn_user_handle IS NOT NULL')
    )

    # 2. Create credentials table
    op.create_table(
        'credentials',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Primary key'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Foreign key to users table'),
        sa.Column('credential_id', sa.Text(), nullable=False, comment='WebAuthn credential ID (Base64URL encoded)'),
        sa.Column('public_key', sa.Text(), nullable=False, comment='Public key (CBOR encoded)'),
        sa.Column('counter', sa.BigInteger(), nullable=False, server_default='0', comment='Signature counter for replay protection'),
        sa.Column('transports', postgresql.ARRAY(sa.Text()), nullable=True, comment='Supported transports: usb, nfc, ble, internal'),
        sa.Column('device_name', sa.Text(), nullable=True, comment='User-friendly device name'),
        sa.Column('aaguid', postgresql.UUID(as_uuid=True), nullable=True, comment='Authenticator AAGUID'),
        sa.Column('backup_eligible', sa.Boolean(), nullable=False, server_default='false', comment='Whether credential is backup eligible'),
        sa.Column('backup_state', sa.Boolean(), nullable=False, server_default='false', comment='Whether credential is currently backed up'),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='Credential creation timestamp'),
        sa.Column('last_used_at', sa.TIMESTAMP(), nullable=True, comment='Last successful authentication timestamp'),

        # Foreign key constraint
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id'],
            name='fk_credentials_user',
            ondelete='CASCADE'
        ),

        # Unique constraint on credential_id
        sa.UniqueConstraint('credential_id', name='uq_credentials_credential_id'),

        comment='WebAuthn credentials (Passkeys) for passwordless authentication'
    )

    # 3. Create indexes for efficient queries
    op.create_index('idx_credentials_user_id', 'credentials', ['user_id'])
    op.create_index('idx_credentials_credential_id', 'credentials', ['credential_id'], unique=True)
    op.create_index('idx_credentials_last_used', 'credentials', ['last_used_at'], postgresql_using='btree')

    print("✅ WebAuthn support added successfully")
    print("   - Added webauthn_user_handle to users table")
    print("   - Created credentials table")
    print("   - Created 4 indexes")


def downgrade() -> None:
    """
    Remove WebAuthn support from the database schema.
    """
    # Drop indexes
    op.drop_index('idx_credentials_last_used', table_name='credentials')
    op.drop_index('idx_credentials_credential_id', table_name='credentials')
    op.drop_index('idx_credentials_user_id', table_name='credentials')

    # Drop credentials table
    op.drop_table('credentials')

    # Drop index and column from users table
    op.drop_index('idx_users_webauthn_handle', table_name='users')
    op.drop_column('users', 'webauthn_user_handle')

    print("✅ WebAuthn support removed successfully")
