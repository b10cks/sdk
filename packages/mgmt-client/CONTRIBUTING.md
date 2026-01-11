# Contributing to @b10cks/mgmt-client

Thank you for your interest in contributing to the b10cks Management Client! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/b10cks/sdk.git
cd sdk
```

2. Install dependencies:
```bash
pnpm install
```

3. Navigate to the management client package:
```bash
cd packages/mgmt-client
```

### Development Workflow

#### Building

Build the package:
```bash
pnpm build
```

Watch mode for development:
```bash
pnpm dev
```

#### Testing

Run tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test --watch
```

Run tests with coverage:
```bash
pnpm test --coverage
```

#### Linting

Lint and fix code:
```bash
pnpm lint
```

#### Cleaning

Remove build artifacts:
```bash
pnpm clean
```

## Code Standards

### TypeScript

- Use TypeScript for all source files
- Maintain strict type safety
- Export all public types from `types.ts`
- Use interfaces for data structures
- Use type aliases for unions and complex types

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Keep functions small and focused (Single Responsibility Principle)
- Avoid comments unless strategically necessary for complex logic
- Use async/await over promises
- Prefer const over let, avoid var

### Architecture Principles

We follow SOLID principles and clean code practices:

#### Single Responsibility Principle
Each class and function should have one reason to change. Resource managers handle only their specific domain.

#### Open/Closed Principle
Classes should be open for extension but closed for modification. Use composition over inheritance.

#### Liskov Substitution Principle
Derived classes must be substitutable for their base classes.

#### Interface Segregation Principle
Clients should not depend on interfaces they don't use.

#### Dependency Inversion Principle
Depend on abstractions, not concretions. Resources depend on HttpClient interface.

### File Structure

```
src/
├── client.ts              # Main client class
├── http-client.ts         # HTTP communication layer
├── index.ts               # Public API exports
├── types.ts               # Type definitions
└── resources/             # Resource managers
    ├── users.ts
    ├── teams.ts
    ├── spaces.ts
    └── ...
```

### Naming Conventions

- **Files**: kebab-case (e.g., `block-tags.ts`)
- **Classes**: PascalCase (e.g., `ManagementClient`)
- **Functions/Methods**: camelCase (e.g., `getMe()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT`)
- **Interfaces/Types**: PascalCase (e.g., `ClientConfig`)

## Adding New Features

### Adding a New Resource

1. Create a new file in `src/resources/`:
```typescript
import type { HttpClient } from '../http-client'
import type { YourType } from '../types'

export class YourResource {
  constructor(private readonly client: HttpClient) {}

  async list(): Promise<YourType[]> {
    return this.client.get<YourType[]>('/mgmt/v1/your-endpoint')
  }

  async get(id: string): Promise<YourType> {
    return this.client.get<YourType>(`/mgmt/v1/your-endpoint/${id}`)
  }

  async create(data: CreateYourParams): Promise<YourType> {
    return this.client.post<YourType>('/mgmt/v1/your-endpoint', data)
  }

  async update(id: string, data: UpdateYourParams): Promise<YourType> {
    return this.client.put<YourType>(`/mgmt/v1/your-endpoint/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/your-endpoint/${id}`)
  }
}
```

2. Add types to `src/types.ts`:
```typescript
export interface YourType {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface CreateYourParams {
  name: string
}

export interface UpdateYourParams {
  name?: string
}
```

3. Register resource in `src/client.ts`:
```typescript
import { YourResource } from './resources/your-resource'

export class ManagementClient {
  public readonly yourResource: YourResource

  constructor(config: ClientConfig) {
    // ...
    this.yourResource = new YourResource(this.httpClient)
  }
}
```

4. Export types from `src/index.ts`:
```typescript
export type { YourType, CreateYourParams, UpdateYourParams } from './types'
```

5. Add tests in `src/resources/your-resource.test.ts`

6. Update README.md with usage examples

### Adding a New Endpoint to Existing Resource

1. Add method to resource class
2. Add types if needed
3. Add tests
4. Update documentation

## Testing Guidelines

### Unit Tests

- Test all public methods
- Mock HTTP client responses
- Test error handling
- Test edge cases
- Maintain high coverage (>80%)

### Test Structure

```typescript
describe('ResourceName', () => {
  const mockConfig = {
    baseUrl: 'https://api.test.com',
    token: 'test-token',
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('methodName', () => {
    it('should perform expected action', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      // Act
      const client = new ManagementClient(mockConfig)
      const result = await client.resource.method()

      // Assert
      expect(result).toEqual(mockData)
    })
  })
})
```

## Documentation

### Code Documentation

- Document complex logic with inline comments
- Use JSDoc for public APIs
- Keep documentation up-to-date with code changes

### README Updates

When adding features, update:
- API Resources section with new methods
- Examples with practical usage
- Type exports list

### Examples

Add practical examples to `examples/` directory demonstrating:
- Common use cases
- Best practices
- Error handling
- Advanced scenarios

## Pull Request Process

1. **Fork and Branch**
   - Fork the repository
   - Create a feature branch: `git checkout -b feature/your-feature-name`

2. **Make Changes**
   - Write code following the guidelines above
   - Add or update tests
   - Update documentation

3. **Test**
   - Run tests: `pnpm test`
   - Run linter: `pnpm lint`
   - Build package: `pnpm build`

4. **Commit**
   - Use clear, descriptive commit messages
   - Follow conventional commits format:
     - `feat: add new resource`
     - `fix: resolve bug in pagination`
     - `docs: update README`
     - `test: add tests for users resource`
     - `refactor: improve error handling`

5. **Submit PR**
   - Push to your fork
   - Create pull request to main repository
   - Fill out PR template
   - Link related issues

6. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Re-request review after updates

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Push tag to trigger release workflow
5. npm publish (automated via CI/CD)

## Questions and Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Security**: Report security issues privately

## Code of Conduct

Be respectful, professional, and constructive. We're all here to build great software together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
