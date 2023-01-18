const ipAddr = require('ipaddr.js')
const axios = require('axios')
const https = require('https');

async function axiosGet(req, url) {
    try {
        const response = await axios.get(url, {
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        })
        req.health = { 
            statusCode: response.status,
            body: response.data
        }
    } catch (err) {
        req.health = {
            statusCode: err.message || err.code,
            body: ""
        }
    }
}

async function fetchUrl(req, res, next) {
    try {
        const webhookURL = req.body.webhookURL
        const ip = new URL(webhookURL).hostname
        if (ipAddr.isValid(ip)) {
            const range = ipAddr.parse(ip).range()
            if (range === 'loopback') {
                req.health = {
                    statusCode: 'ip not allowed',
                    body: ""
                }
            } else {
                await axiosGet(req, webhookURL)
            } 

        } else if (ip.toLowerCase() === 'localhost') {
            req.health = {
                statusCode: 'ip not allowed',
                body: ""
            }
        } else {
            await axiosGet(req, webhookURL)
        }
    }
    catch (err) {
        req.health = {
            statusCode: err.message || err.code,
            body: ""
        }
    }  
    next() 
}

module.exports = fetchUrl
