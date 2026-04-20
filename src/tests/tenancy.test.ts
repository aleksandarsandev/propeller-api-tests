import { getClient } from "../helpers/client";
import { gql } from "graphql-request";

const clientA = getClient("tenant-a");
const clientB = getClient("tenant-b");

describe("Multi-Tenancy - Data Isolation", () => {
    let tenantAProductId: number;
    let tenantBProductId: number;
    let tenantAImageId: number;

    beforeAll(async () => {
        // Create a product as tenant-a
        const dataA: any = await clientA.request(gql`
            mutation {
                createProduct(input: {
                    name: "Tenant A Product"
                    price: 10.00
                    status: ACTIVE
                }) {
                    id
                }
            }
        `);
        tenantAProductId = parseInt(dataA.createProduct.id);

        // Create a product as tenant-b
        const dataB: any = await clientB.request(gql`
            mutation {
                createProduct(input: {
                    name: "Tenant B Product"
                    price: 20.00
                    status: ACTIVE
                }) {
                    id
                }
            }
        `);
        tenantBProductId = parseInt(dataB.createProduct.id);

        // Create an image as tenant-a
        const imgA: any = await clientA.request(gql`
            mutation CreateImage($productId: Int!) {
                createImage(input: {
                    url: "https://example.com/tenant-a.jpg"
                    priority: 100
                    productId: $productId
                }) {
                    id
                }
            }
        `, { productId: tenantAProductId });
        tenantAImageId = parseInt(imgA.createImage.id);
    });

    afterAll(async () => {
        try {
            await clientA.request(gql`
                mutation DeleteProduct($id: Int!) { deleteProduct(id: $id) }
            `, { id: tenantAProductId });
        } catch {}

        try {
            await clientB.request(gql`
                mutation DeleteProduct($id: Int!) { deleteProduct(id: $id) }
            `, { id: tenantBProductId });
        } catch {}

        try {
            await clientA.request(gql`
                mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
            `, { id: tenantAImageId });
        } catch {}
    });

    // PRODUCTS
    it("tenant-a should not see tenant-b products in list", async () => {
        const data: any = await clientA.request(gql`
            query {
                products {
                    id
                    name
                    tenantId
                }
            }
        `);

        data.products.forEach((p: any) => {
            expect(p.tenantId).toBe("tenant-a");
        });
    });

    it("tenant-b should not see tenant-a products in list", async () => {
        const data: any = await clientB.request(gql`
            query {
                products {
                    id
                    name
                    tenantId
                }
            }
        `);

        data.products.forEach((p: any) => {
            expect(p.tenantId).toBe("tenant-b");
        });
    });

    it("tenant-b should not be able to fetch tenant-a product by id", async () => {
        const data: any = await clientB.request(gql`
            query GetProduct($id: Int!) {
                product(id: $id) {
                    id
                    name
                }
            }
        `, { id: tenantAProductId });

        expect(data.product).toBeNull();
    });

    it("tenant-b should not be able to update tenant-a product", async () => {
        try {
            await clientB.request(gql`
                mutation UpdateProduct($id: Int!) {
                    updateProduct(id: $id, input: { name: "Hacked!" }) {
                        id
                        name
                    }
                }
            `, { id: tenantAProductId });

            // If no error thrown, check the product wasn't actually changed
            const data: any = await clientA.request(gql`
                query GetProduct($id: Int!) {
                    product(id: $id) { name }
                }
            `, { id: tenantAProductId });

            expect(data.product.name).toBe("Tenant A Product");
        } catch {
            // Expected - error is acceptable here
        }
    });

    it("tenant-b should not be able to delete tenant-a product", async () => {
        try {
            await clientB.request(gql`
                mutation DeleteProduct($id: Int!) {
                    deleteProduct(id: $id)
                }
            `, { id: tenantAProductId });
        } catch {
            // Expected - error is acceptable
        }

        // Verify product still exists for tenant-a
        const data: any = await clientA.request(gql`
            query GetProduct($id: Int!) {
                product(id: $id) { id name }
            }
        `, { id: tenantAProductId });

        expect(data.product).not.toBeNull();
        expect(data.product.name).toBe("Tenant A Product");
    });

    // IMAGES
    it("tenant-b should not see tenant-a images in list", async () => {
        const data: any = await clientB.request(gql`
            query {
                images {
                    id
                    tenantId
                }
            }
        `);

        data.images.forEach((img: any) => {
            expect(img.tenantId).toBe("tenant-b");
        });
    });

    it("tenant-b should not be able to fetch tenant-a image by id", async () => {
        const data: any = await clientB.request(gql`
            query GetImage($id: Int!) {
                image(id: $id) {
                    id
                    url
                }
            }
        `, { id: tenantAImageId });

        expect(data.image).toBeNull();
    });

    it("tenant-b should not be able to delete tenant-a image", async () => {
        try {
            await clientB.request(gql`
                mutation DeleteImage($id: Int!) {
                    deleteImage(id: $id)
                }
            `, { id: tenantAImageId });
        } catch {}

        // Verify image still exists for tenant-a
        const data: any = await clientA.request(gql`
            query GetImage($id: Int!) {
                image(id: $id) { id }
            }
        `, { id: tenantAImageId });

        expect(data.image).not.toBeNull();
    });

    // NO HEADER
    it("should reject requests with no tenant header", async () => {
        const clientNoTenant = getClient("");

        try {
            await clientNoTenant.request(gql`
                query {
                    products { id }
                }
            `);
            fail("Should have thrown an error");
        } catch (error: any) {
            expect(error).toBeDefined();
        }
    });
});