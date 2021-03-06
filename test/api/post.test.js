import { describe } from 'ava-spec';
import request from 'supertest-as-promised';
import { getAllElements, loadFixtures } from '../helpers';
import app from '../../src/app';

const URI = '/posts';

let dbObjects;
let categories;

describe.serial('Post API', it => {
    it.beforeEach(() =>
        loadFixtures()
            .then(() => getAllElements('Post'))
            .then(response => {
                dbObjects = response;
            })
            .then(() => getAllElements('Category'))
            .then(response => {
                categories = response;
            })
    );

    it('should reitrieve a list of all posts', async t => {
        const response = await request(app)
            .get(URI)
            .expect(200)
            .then(res => res.body);
        t.is(response.length, dbObjects.length);
    });

    it('should return a single post', async t => {
        const fixture = dbObjects[0];
        const response = await request(app)
            .get(`${URI}/${fixture.id}`)
            .expect(200);
        t.is(response.body.name, fixture.name);
    });

    it('should return ResourceNotFound when retrieving nonexisting post', async t => {
        const fixture = dbObjects[0];
        const response = await request(app)
            .get(`${URI}/${fixture.id + 10000}`)
            .expect(404);
        t.is(response.body.name, 'ResourceNotFoundError');
        t.is(response.body.message, 'Could not find resource of type post');
    });

    it('should add a new post', async t => {
        const content = {
            title: 'New post',
            lead: 'New post that you have to read',
            content: 'Great new post',
            coverPhoto: 'http://imgur.com',
            authorId: null,
            pinned: false
        };
        const response = await request(app)
            .post(URI)
            .send(content)
            .expect(201);
        t.is(response.body.name, content.name);
    });

    it('should add a slug to a new post', async t => {
        const content = {
            title: 'New post 2',
            lead: 'New post that you have to read 2',
            content: 'Great new post. The best post, really.',
            coverPhoto: 'http://imgur.com',
            authorId: null,
            pinned: false
        };
        const response = await request(app)
            .post(URI)
            .send(content)
            .expect(201);
        t.not(response.body.slug, null);
    });


    it('should be able to update a post', async () => {
        const post = dbObjects[0];
        await request(app)
            .put(`${URI}/${post.id}`)
            .send({ name: 'changed' })
            .expect(204);
    });

    it('should be able to delete a post', async () => {
        const post = dbObjects[0];
        await request(app)
            .delete(`${URI}/${post.id}`)
            .expect(204);
    });

    it('should be able to add a category to a post', async () => {
        const fixture = dbObjects[0];
        const category = categories[0];
        await request(app)
            .put(`${URI}/${fixture.id}/categories/${category.id}`)
            .expect(204);
    });

    it('should return ResourceNotFound when adding category to nonexisting post', async t => {
        const fixture = dbObjects[0];
        const category = categories[0];
        const response = await request(app)
            .put(`${URI}/${fixture.id + 1000}/categories/${category.id}`)
            .expect(404);
        t.is(response.body.name, 'ResourceNotFoundError');
        t.is(response.body.message, 'Could not find resource of type post');
    });

    it('should return ResourceNotFound when adding nonexisting category to post', async t => {
        const fixture = dbObjects[0];
        const category = categories[0];
        const response = await request(app)
            .put(`${URI}/${fixture.id}/categories/${category.id + 100}`)
            .expect(404);
        t.is(response.body.name, 'ResourceNotFoundError');
        t.is(response.body.message, 'Could not find resource of type category');
    });

    it('should be able to remove a category from post', async t => {
        const post = dbObjects[0];
        const response = await request(app)
            .delete(`${URI}/${post.id}/categories/${post.categories[0].id}`)
            .expect(204)
            .then(() => request(app).get(`${URI}/${post.id}`))
            .then(res => res.body);
        t.is(response.categories.length, 1);
    });
});
