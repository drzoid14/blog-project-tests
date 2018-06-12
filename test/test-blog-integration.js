'use strict';

const mongoose = require('mongoose');
const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');

const expect = chai.expect;

chai.use(chaiHTTP);

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

function seedBlogPosts() {
    console.log('seeding posts')
    const seedData = [];

    for (let i = 1; i < 10; i++) {
        seedData.push(generateBlogPost());
    }

    return BlogPost.insertMany(seedData);
}

function generateBlogPost() {
    return {
        title: faker.lorem.sentence(3),
        content: faker.lorem.paragraph(5),
        author: {
            firstName: faker.name.findName(),
            lastName: faker.name.findName()
        },
        date: faker.date.recent

    }
}

function tearDown() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('BlogPost API Resources', function () {

    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedBlogPosts();
    });

    afterEach(function () {
        return tearDown();
    });

    after(function () {
        return closeServer();
    });

    //test GET
    describe('GET function', function () {

        it('Should return all current Blog Posts', function () {

            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    expect(res).to.be.json;
                    expect(res.body).to.have.length.greaterThan(0);
                    expect(res).to.have.status(200);
                })

        });

        it('Should have the right keys', function () {
            let res;
            let testPost;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    expect(res.body).to.be.a('array');

                    testPost = res.body[0];
                    return BlogPost.findById(testPost.id)


                })
                .then(function (post) {

                    expect(testPost.id).to.equal(post.id);
                    expect(testPost.title).to.equal(post.title);
                    expect(testPost.content).to.equal(post.content);
                    expect(testPost.author).to.equal(post.author.firstName + " " + post.author.lastName);
                    expect(new Date(testPost.created).toString()).to.equal(new Date(post.created).toString());
                });

        });

    });

    //test POST
    describe('POST function', function () {

        it('Should create a new Blog Post', function () {

            let res;
            let fakePost = {
                title: "New Day",
                content: "I promise to not party",
                author: {
                    firstName: "Some",
                    lastName: "Guy"
                },
            }

            let authorName = fakePost.author.firstName + " " + fakePost.author.lastName;

            return chai.request(app)
                .post('/posts')
                .send(fakePost)
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(201);
                    expect(res.body.id).to.have.length.greaterThan(0);
                    expect(res.body.title).to.equal(fakePost.title);
                    expect(res.body.content).to.equal(fakePost.content);
                    expect(res.body.author).to.equal(authorName);


                });


        });


    });

    //test PUT
    describe('PUT function', function () {

        it('should update a current post', function () {

            let updatedPost;
            let res;

            let newInfo = {
                title: "NEW TITLE",
                content: "NEW CONTENT"
            };
            let newPost;

              return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    updatedPost = res.body[0];
                    newInfo.id=updatedPost.id;
                   return chai.request(app)
                        .put('/posts/'+updatedPost.id)
                        .send(newInfo)




                })
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(204);
                
                    return chai.request(app)
                        .get('/posts')
                })


                .then(function (_res) {
                    res = _res;
                    newPost = res.body[0];
                    expect(newPost.title).to.equal(newInfo.title);
                    expect(newPost.content).to.equal(newInfo.content);
                })
                

        })

    })


    //test DELETE
    describe('DELETE function', function(){
        it('Should delete a current post',function(){
        let deletedPost;
        let length;

        return chai.request(app)
        .get('/posts')
        .then(function(res){
            deletedPost = res.body[0];
            console.log(deletedPost.id);
            length = res.body.length;

            return chai.request(app)
            .delete('/posts/'+deletedPost.id)
        })
        .then(function(res){
            expect(res).to.have.status(204);
            return chai.request(app)
            .get('/posts')
        })
        .then(function(res){
            expect(res.body.length).to.be.lessThan(length);
        })
    })
})

});  