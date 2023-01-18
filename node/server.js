const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const fetchUrl = require('./middleware')

const app = express()

app.use(express.static('public'))
app.use(express.urlencoded())
app.use(fetchUrl)

app.get('/', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname })
})

app.post('/', fetchUrl, async (req, res) => {
    const postData = {...req.body, ... req.health}
    try {
        await axios.post(postData.payloadURL, postData, { timeout: 20000 })
        res.redirect('/')
    } 
    catch (error) {
        if (error.code === 'ENOTFOUND') { 
            return res.status(400).json({ payloadURL: error.config.url, 
                                          error: error.code,
                                          message: "Host could not be resolved"
                                        })
                                    
        } else if (error.code === 'EHOSTUNREACH') {
            return res.status(400).json({ payloadURL: error.config.url, 
                                          error: error.code,
                                          message: "Host not found"
                                        })
        
        } else if (error.code === 'ECONNABORTED') {
            return res.json({ payloadURL: error.config.url, 
                              sent: `${JSON.stringify(postData)}`
                            })

        } else if (error.code === 'ECONNREFUSED') {
            const url = new URL(error.config.url)
            const payloadURL = url.origin
            const port = url.port || (url.protocol === 'https:' ? 443 : 80)
            return res.json({ payloadURL: payloadURL, 
                              error: error.code,
                              message: `Connection to host refused. Check the host is listening on port ${port}`
                            })

        } else {
            return res.redirect('/')
        }
    }
    res.redirect('/')
})

app.listen(5000)
