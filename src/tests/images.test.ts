import {getClient} from "../helpers/client";
import {gql} from "graphql-request";

const client = getClient("tenant-a");

describe("Images - CRUD", () => {
    let createdImageId: number;
    let createdProductId: number;

    beforeAll(async () => {
        // Create a product to associate images with
        const mutation = gql`
            mutation {
                createProduct(input: {
                    name: "Image Test Product"
                    price: 19.99
                    status: ACTIVE
                }) {
                    id
                }
            }
        `;
        const data: any = await client.request(mutation);
        createdProductId = parseInt(data.createProduct.id);
    });

    afterAll(async () => {
        // Clean up product after tests
        const mutation = gql`
            mutation DeleteProduct($id: Int!) {
                deleteProduct(id: $id)
            }
        `;
        await client.request(mutation, {id: createdProductId});
    });

    // CREATE
    it("should create an image", async () => {
        const mutation = gql`
            mutation CreateImage($productId: Int!) {
                createImage(input: {
                    url: "https://example.com/image.jpg"
                    priority: 100
                    productId: $productId
                }) {
                    id
                    url
                    priority
                    productId
                }
            }
        `;

        const data: any = await client.request(mutation, {productId: createdProductId});
        const image = data.createImage;

        expect(image).toBeDefined();
        expect(image.id).toBeDefined();
        expect(image.url).toBe("https://example.com/image.jpg");
        expect(image.priority).toBe(100);
        expect(parseInt(image.productId)).toBe(createdProductId);

        createdImageId = parseInt(image.id);
    });

    // CREATE orphan image (no product)
    it("should create an image without a product", async () => {
        const mutation = gql`
            mutation {
                createImage(input: {
                    url: "https://example.com/orphan.jpg"
                    priority: 50
                }) {
                    id
                    url
                    productId
                }
            }
        `;

        const data: any = await client.request(mutation);
        const image = data.createImage;

        expect(image).toBeDefined();
        expect(image.url).toBe("https://example.com/orphan.jpg");
        expect(image.productId).toBeNull();

        // Clean up
        const deleteMutation = gql`
            mutation DeleteImage($id: Int!) {
                deleteImage(id: $id)
            }
        `;
        await client.request(deleteMutation, {id: parseInt(image.id)});
    });

    // READ single
    it("should fetch a single image by id", async () => {
        const query = gql`
            query GetImage($id: Int!) {
                image(id: $id) {
                    id
                    url
                    priority
                }
            }
        `;

        const data: any = await client.request(query, {id: createdImageId});
        const image = data.image;

        expect(image).toBeDefined();
        expect(parseInt(image.id)).toBe(createdImageId);
        expect(image.url).toBe("https://example.com/image.jpg");
    });

    // READ list
    it("should fetch all images", async () => {
        const query = gql`
            query {
                images {
                    id
                    url
                    priority
                }
            }
        `;

        const data: any = await client.request(query);
        expect(Array.isArray(data.images)).toBe(true);
        expect(data.images.length).toBeGreaterThan(0);
    });

    // READ filtered by productId
    it("should fetch images filtered by productId", async () => {
        const query = gql`
            query GetImages($productId: Int!) {
                images(productId: $productId) {
                    id
                    url
                    productId
                }
            }
        `;

        const data: any = await client.request(query, {productId: createdProductId});
        expect(data.images.length).toBeGreaterThan(0);
        data.images.forEach((img: any) => {
            expect(parseInt(img.productId)).toBe(createdProductId);
        });
    });

    // UPDATE
    it("should update an image", async () => {
        const mutation = gql`
            mutation UpdateImage($id: Int!) {
                updateImage(id: $id, input: {
                    url: "https://example.com/updated.jpg"
                    priority: 200
                }) {
                    id
                    url
                    priority
                }
            }
        `;

        const data: any = await client.request(mutation, {id: createdImageId});
        const image = data.updateImage;

        expect(image.url).toBe("https://example.com/updated.jpg");
        expect(image.priority).toBe(200);
    });

    // DELETE
    it("should delete an image", async () => {
        const mutation = gql`
            mutation DeleteImage($id: Int!) {
                deleteImage(id: $id)
            }
        `;

        const data: any = await client.request(mutation, {id: createdImageId});
        expect(data.deleteImage).toBe(true);
    });

    // CONFIRM DELETION
    it("should return null when fetching a deleted image", async () => {
        const query = gql`
            query GetImage($id: Int!) {
                image(id: $id) {
                    id
                    url
                }
            }
        `;

        const data: any = await client.request(query, {id: createdImageId});
        expect(data.image).toBeNull();
    });
});