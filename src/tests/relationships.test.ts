import { getClient } from "../helpers/client";
import { gql } from "graphql-request";

const client = getClient("tenant-a");

describe("Relationships - Products and Images", () => {
    let productId: number;
    let imageId1: number;
    let imageId2: number;

    beforeAll(async () => {
        // Create a product
        const mutation = gql`
            mutation {
                createProduct(input: {
                    name: "Relationship Test Product"
                    price: 99.99
                    status: ACTIVE
                }) {
                    id
                }
            }
        `;
        const data: any = await client.request(mutation);
        productId = parseInt(data.createProduct.id);

        // Create two images for that product
        const img1: any = await client.request(gql`
            mutation CreateImage($productId: Int!) {
                createImage(input: {
                    url: "https://example.com/image1.jpg"
                    priority: 100
                    productId: $productId
                }) {
                    id
                }
            }
        `, { productId });
        imageId1 = parseInt(img1.createImage.id);

        const img2: any = await client.request(gql`
            mutation CreateImage($productId: Int!) {
                createImage(input: {
                    url: "https://example.com/image2.jpg"
                    priority: 200
                    productId: $productId
                }) {
                    id
                }
            }
        `, { productId });
        imageId2 = parseInt(img2.createImage.id);
    });

    afterAll(async () => {
        // Clean up images
        for (const id of [imageId1, imageId2]) {
            try {
                await client.request(gql`
                    mutation DeleteImage($id: Int!) {
                        deleteImage(id: $id)
                    }
                `, { id });
            } catch {
                // already deleted, ignore
            }
        }

        // Clean up product
        try {
            await client.request(gql`
                mutation DeleteProduct($id: Int!) {
                    deleteProduct(id: $id)
                }
            `, { id: productId });
        } catch {
            // already deleted, ignore
        }
    });

    it("should return images when fetching a product", async () => {
        const query = gql`
            query GetProduct($id: Int!) {
                product(id: $id) {
                    id
                    name
                    images {
                        id
                        url
                        priority
                    }
                }
            }
        `;

        const data: any = await client.request(query, { id: productId });
        const product = data.product;

        expect(product.images).toBeDefined();
        expect(product.images.length).toBe(2);
    });

    it("should return images sorted by priority", async () => {
        const query = gql`
            query GetProduct($id: Int!) {
                product(id: $id) {
                    images {
                        id
                        priority
                    }
                }
            }
        `;

        const data: any = await client.request(query, { id: productId });
        const priorities = data.product.images.map((img: any) => img.priority);

        const sorted = [...priorities].sort((a, b) => a - b);
        expect(priorities).toEqual(sorted);
    });

    it("should return the associated product when fetching an image", async () => {
        const query = gql`
            query GetImage($id: Int!) {
                image(id: $id) {
                    id
                    url
                    product {
                        id
                        name
                    }
                }
            }
        `;

        const data: any = await client.request(query, { id: imageId1 });
        const image = data.image;

        expect(image.product).toBeDefined();
        expect(parseInt(image.product.id)).toBe(productId);
        expect(image.product.name).toBe("Relationship Test Product");
    });

    it("should return only images belonging to a specific product", async () => {
        const query = gql`
            query GetImages($productId: Int!) {
                images(productId: $productId) {
                    id
                    productId
                }
            }
        `;

        const data: any = await client.request(query, { productId });
        expect(data.images.length).toBe(2);
        data.images.forEach((img: any) => {
            expect(parseInt(img.productId)).toBe(productId);
        });
    });

    it("should return null for product when image is an orphan", async () => {
        // Create orphan image
        const createData: any = await client.request(gql`
            mutation {
                createImage(input: {
                    url: "https://example.com/orphan.jpg"
                    priority: 50
                }) {
                    id
                }
            }
        `);
        const orphanId = parseInt(createData.createImage.id);

        const query = gql`
            query GetImage($id: Int!) {
                image(id: $id) {
                    id
                    product {
                        id
                    }
                }
            }
        `;

        const data: any = await client.request(query, { id: orphanId });
        expect(data.image.product).toBeNull();

        // Clean up
        await client.request(gql`
            mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
        `, { id: orphanId });
    });
});