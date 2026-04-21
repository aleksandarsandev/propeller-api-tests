# Propeller API Tests

Automated test suite for the Propeller E-Commerce GraphQL API, built as part of the Junior SDET assignment.

## Tech Stack

- **Runtime:** Node.js 20
- **Test Framework:** Jest
- **GraphQL Client:** graphql-request
- **Language:** TypeScript

## Prerequisites

- Node.js 20+
- The Propeller API running locally on `http://localhost:3000/graphql`

## Getting Started

### 1. Start the API

In the API project folder:

```bash
docker-compose up --build
```

In a separate terminal, seed the database:

```bash
docker-compose run --rm seed
```

### 2. Install test dependencies

```bash
npm install
```

### 3. Run the tests

```bash
npm test
```

## Test Structure

```
propeller-api-tests/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── helpers/
│   │   └── client.ts
│   └── tests/
│       ├── edge-cases.test.ts
│       ├── error-handling.test.ts
│       ├── images.test.ts
│       ├── products.test.ts
│       ├── products-filtering.test.ts
│       ├── products-pagination.test.ts
│       ├── relationships.test.ts
│       ├── tenancy.test.ts
│       └── validation.test.ts
├── jest.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```
## Bugs Found and Fixed

### Bug 1 — Price column type was integer instead of float
**File:** `src/product/product.entity.ts`  
**Problem:** The `price` column was defined as `integer`, causing decimal values like `29.99` to be rejected. In the product model it is defined as `float`.  
**Fix:** Changed the column type to `float`:
```ts
@Column({ type: 'float' })
price: number;
```

---

### Bug 2 — Seeder was overriding the database schema
**File:** `src/seed.ts`  
**Problem:** The seeder had its own `DataSource` with `synchronize: true`. Since all seed prices were whole numbers, TypeORM inferred the `price` column as `integer` and altered the database schema on every seed, overriding the correct `float` type set by the API.  
**Fix:** Changed `synchronize` to `false` in the seeder's DataSource so it only inserts data without modifying the schema:
```ts
synchronize: false,
```

---

### Bug 3 — findOne ignored tenantId (security vulnerability)
**File:** `src/product/product.service.ts`  
**Problem:** The `findOne` method only filtered by `id`, ignoring `tenantId`. This allowed any tenant to read, update, or delete another tenant's products — a critical security vulnerability.  
**Fix:** Added `tenantId` to the `where` clause:
```ts
const product = await this.productRepository.findOne({
  where: { id, tenantId },
  relations: ['images'],
});
```

---

### Bug 4 — findOne threw exception instead of returning null
**Files:** `src/product/product.service.ts`, `src/image/image.service.ts`, `src/product/product.resolver.ts`, `src/image/image.resolver.ts`  
**Problem:** Querying a non-existent product or image by ID threw a `NotFoundException` instead of returning `null`, which is the correct GraphQL behavior for nullable fields.  
**Fix:** Change return in `findOne` method, `object` or `null` when not found. Updated resolvers to mark the query as `nullable: true`:
```ts
async findOne(id: number, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['images'],
    });

      return product ?? null;
  }

@Query(() => Product, { name: 'product', nullable: true })
```
```ts
 async findOne(id: number, tenantId: string): Promise<Image> {
    const image = await this.imageRepository.findOne({
      where: { id, tenantId },
      relations: ['product'],
    });

      return image ?? null;
  }

 @Query(() => Image, { name: 'image', nullable: true })

```

### Bug 5 — Status filter was inverted
**File:** `src/product/product.service.ts`  
**Problem:** The status filter logic was inverted — when filtering for `ACTIVE` products it queried for `INACTIVE` and vice versa due to a incorrect ternary operator.  
**Fix:** Change the filter logic as it should be (also, we can remove the ternary and pass the filter status directly):
```ts
if (filter?.status) {
      const filterStatus =
        filter.status === ProductStatus.ACTIVE
          ? ProductStatus.ACTIVE
          : ProductStatus.INACTIVE;
      qb.andWhere('product.status = :status', { status: filterStatus });
    }
```
---
### Bug 6 — Pagination offset was incorrect
**File:** `src/product/product.service.ts`  
**Problem:** The pagination used `page * pageSize` for the skip offset, which caused page 1 to skip the first 10 records entirely, returning wrong results for all pages.  
**Fix:** Changed to `(page - 1) * pageSize` so page 1 starts at offset 0:
```ts
qb.skip((page - 1) * pageSize).take(pageSize);
```
---
### Bug 7 — No price validation (negative and zero prices accepted)
**Files:** `src/product/product.dto.ts`, `src/main.ts`  
**Problem:** The API accepted negative and zero prices because there were no validation decorators on the `price` field and no `ValidationPipe` registered in the application.  
**Fix:** Added `@IsPositive()` to price fields in the DTO and registered `ValidationPipe` globally in `main.ts`:
```ts
app.useGlobalPipes(new ValidationPipe());
```
```ts
  @Field(() => Float)
  @IsOptional()
  @IsPositive()
  price: number;
```
---

### Bug 8 — No price filter validation
**File:** `src/image/product.dto.ts`  
**Problem:** For filtering by price you can add negative values in input field, which is incorrect.   
**Fix:** Added `@Min(0)` and `@Max(0)` to `minPrice` and `maxPrice`:
```ts
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  maxPrice?: number;
```
---

### Bug 9 — No image priority validation
**File:** `src/image/image.dto.ts`  
**Problem:** The README specifies that image priority must be between 1 and 1000, but there were no validation decorators enforcing this constraint.  
**Fix:** Added `@Min(1)` and `@Max(1000)` decorators to the priority field:
```ts
@Min(1)
@Max(1000)
priority?: number;
```

---

### Bug 10 — Image priority default value was 0 instead of 100
**File:** `src/image/image.entity.ts`  
**Problem:** The `priority` column had a default value of `0`, which is below the minimum valid value of `1` according to the README which specifies the default should be `100`.  
**Fix:** Changed the default value to `100`:
```ts
@Column({ type: 'int', default: 100 })
priority: number;
```

---

### Bug 11 — Deleting product with images caused foreign key error
**File:** `src/image/image.entity.ts`  
**Problem:** Deleting a product that had associated images threw a raw PostgreSQL foreign key constraint error because the database did not know what to do with the images when their parent product was deleted.  
**Fix:** Added `onDelete: 'CASCADE'` to the `ManyToOne` relation in the Image entity so that when a product is deleted, all its associated images are automatically deleted as well:
```ts
  @Field(() => Product, { nullable: true })
  @ManyToOne(() => Product, (product) => product.images, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: Product;
```

---

## Assumptions

- The API is running locally on `http://localhost:3000/graphql` during test execution
- The database has been seeded with the provided seed data before running tests
- `tenant-a` and `tenant-b` are the only available tenants in the seed data
- Tests are run sequentially (`--runInBand`) to avoid race conditions caused by parallel test files creating and deleting shared data
- Price must be greater than 0 (positive) based on real-world e-commerce assumptions, even though the README does not explicitly state this
- The `images` query returns only images belonging to the requesting tenant, consistent with the multi-tenancy model applied to products

## CI/CD Pipeline

This project uses GitHub Actions to automatically build and test the application.

### 🔧 Workflow Overview

The pipeline consists of two jobs:

#### 1. Build
- Checks out the repository
- Sets up Node.js (v20)
- Installs dependencies using `npm ci`
- Compiles TypeScript (`tsc --noEmit`) to validate code correctness

#### 2. Test
- Runs after a successful build
- Checks out:
  - The test project (this repository)
  - The API project (external repository)
- Installs Docker Compose
- Starts the API using Docker
- Seeds the database
- Installs test dependencies
- Executes automated tests
- Stops and cleans up Docker containers

###  Triggers

The pipeline runs automatically on:
- Every push from any branch (every commit) in this project
- Every pull request

###  Environment

- Node.js 20
- Docker & Docker Compose used to run the API service
- External API repository accessed via `API_REPO_TOKEN` secret

###  Notes

- The pipeline validates the integration between the test suite and the API service.
- The pipeline works for the specific branch for the task `Version-aleksandarsandev`. 
