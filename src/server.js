import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb'
import path from 'path';

const app = express()
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/build')))

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true  })
        const db = client.db('my-blog')

        operations(db)

        client.close
    } catch (error) {
        res.status(500).json( { message: 'Error connecting to db', error })
    }   
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const article = await db.collection('articles').findOne( { name: articleName })
        res.status(200).json(article);
    }, res)
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async db => {
        const articleName = req.params.name;
        const article = await db.collection('articles').findOne( { name: articleName })
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: article.upvotes + 1
            }
        })

        const updated = await db.collection('articles').findOne( { name: articleName })
        res.status(200).json(updated)
    }, res)
})

app.post('/api/articles/:name/add-comment', (req, res) => {

    withDB( async db => {
        const articleName = req.params.name;
        const { username, text } = req.body
        const article = await db.collection('articles').findOne( { name: articleName })

        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                comments: article.comments.concat({ text, username: username })
            }
        })

        const updated = await db.collection('articles').findOne( { name: articleName })
        res.status(200).json(updated)
    }, res)
    const articleName = req.params.name;
    const { username, text } = req.body

})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => console.log('Listening on port 8001'))