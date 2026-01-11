# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-10

### Added

- Initial release of the b10cks Management API client
- Full TypeScript support with comprehensive type definitions
- User management endpoints
  - Get current user profile
  - Update user information
  - Update avatar
  - Change password
  - Update user settings
- Team management endpoints
  - List, create, update, and delete teams
  - Get team hierarchy
  - Manage team users (add, update, remove)
- Space management endpoints
  - Create, read, update, and delete spaces
  - Update space icons
  - Archive spaces
  - Get space statistics and AI usage
- Block management endpoints
  - List blocks with filtering and pagination
  - Create, read, update, and delete blocks
  - Block tags management
  - Block folders management
- Content management endpoints
  - List contents with filtering
  - Create, read, update, and delete contents
  - Publish and unpublish contents
  - Version control (get, update, publish versions)
  - Set specific version as current
- Asset management endpoints
  - List, create, read, update, and delete assets
  - Asset folders management
  - Asset tags management
- Redirect management endpoints
  - List redirects with filtering
  - Create, read, update, and delete redirects
  - Reset redirect hit counters
- Token management endpoints
  - Create space tokens with expiration and limits
  - Delete tokens
- Data source management endpoints
  - List, create, read, update, and delete data sources
  - Manage data entries within sources
- AI features
  - Get available AI models with filtering
  - Generate meta tags
  - Translate content
- System endpoints
  - Health check
  - Get system configuration
- Comprehensive error handling with `ManagementApiError`
- Request timeout configuration
- Full pagination support for list endpoints
- Clean, SOLID-based architecture with resource managers
- Complete documentation and examples

### Technical Details

- Built with TypeScript for type safety
- Modular resource-based architecture
- HTTP client with automatic retry and timeout handling
- Bearer token authentication
- Comprehensive type definitions for all API entities
- ESM and CJS support
- Zero runtime dependencies

[0.1.0]: https://github.com/b10cks/sdk/releases/tag/@b10cks/mgmt-client@0.1.0
