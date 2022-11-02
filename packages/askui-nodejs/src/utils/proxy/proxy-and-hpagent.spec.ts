import got from 'got';
import { addBasicAuthentication, buildProxy, buildSecureServer, buildSecureProxy, 
    SERVER_HOSTNAME, PROXY_HOSTNAME } from './proxy-utils';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import https from 'https';
import { Server } from 'http';


function pemEncode(str: string, n: number) {
    var ret = [];
  
    for (var i = 1; i <= str.length; i++) {
      ret.push(str[i - 1]);
      var mod = i % n;
  
      if (mod === 0) {
        ret.push('\n');
      }
    }
  
    var returnString = `-----BEGIN CERTIFICATE-----\n${ret.join('')}\n-----END CERTIFICATE-----`;
  
    return returnString;
  }

describe("proxy and hpagent", () => {  
    let httpProxy: Server;

    describe("http proxy", () => {

        beforeEach(async () => {
            httpProxy = await buildProxy()   
        });

        afterEach(() => {
            httpProxy.close()
        });
        
        it('should tunnel https connection over http proxy with valid certificate', async () => {         
            const response = await got.get("https://www.google.com", {retry: 0, agent: {
                https:  new HttpsProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: 'http://localhost:8009'
                })
            }});
                
            expect(response.statusCode).toBe(200);
        });

        it('should tunnel https connection over http proxy with self signed certificate', async () => {
            const httpServer = await buildSecureServer()
            httpServer.on('request', (_req, res) => res.end('ok'))

            const response = await got.get(`https://${SERVER_HOSTNAME}:8081`, {retry: 0, agent: {
                https:  new HttpsProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: 'http://localhost:8009'
                })
            }})
                
            expect(response.statusCode).toBe(200)
            expect(response.body).toBe("ok")
            httpServer.close()
        });

        it('should tunnel http connection over http proxy', async () => {        
            const response = await got.get(`http://www.google.com`, {retry: 0, agent: {
                http:  new HttpProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: 'http://localhost:8009'
                })
            }})
                
            expect(response.statusCode).toBe(200)
        });
    })


    describe('proxy basic authentication', () => {

        beforeEach(async () => {
            httpProxy = await buildProxy()   
        });

        afterEach(() => {
            httpProxy.close()
        });
        
        it('should tunnel https connection over http proxy proxy basic authentication in proxy url', async () => {
            httpProxy = addBasicAuthentication(httpProxy)

            const response = await got.get(`https://www.google.com`, {retry: 0, agent: {
                https:  new HttpsProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: 'http://username:password@localhost:8009'
                })
            }})
                
            expect(response.statusCode).toBe(200)
        });

        it('should tunnel https connection over http proxy proxy basic authentication as proxy header', async () => {
            httpProxy = addBasicAuthentication(httpProxy)

            const response = await got.get(`https://www.google.com`, {retry: 0, agent: {
                https:  new HttpsProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: 'http://localhost:8009',
                    proxyRequestOptions: { 
                        headers: {"proxy-authorization": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="}
                    }
                })
            }})
                
            expect(response.statusCode).toBe(200)
        });
    })



   


    describe("https proxy", () => {

        beforeEach(async () => {
            httpProxy = await buildSecureProxy()   
        });

        afterEach(() => {
            httpProxy.close()
        });
    
        it('should tunnel http connection over https proxy', async () => {
            const response = await got.get(`http://www.google.com`, {retry: 0, agent: {
                http:  new HttpProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: `https://${PROXY_HOSTNAME}:8010`
                })
            }})
                
            expect(response.statusCode).toBe(200)
        });
    
        it('should tunnel https connection over https proxy', async () => {
            const response = await got.get(`https://www.google.com`, {retry: 0, agent: {
                https:  new HttpsProxyAgent({
                    keepAlive: false,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: `https://${PROXY_HOSTNAME}:8010`
                })
            }})
                
            expect(response.statusCode).toBe(200)
        });
    })


    
    xit("get certificate", async () => {

        const httpServer = await buildSecureServer()
        httpServer.on('request', (_req, res) => res.end('ok'))
        var options = {
            host: SERVER_HOSTNAME,
            port: 8081,
            method: 'GET'
        };

        var req = https.request(options, (res: any) => {            
            console.log(pemEncode(res.socket.getPeerCertificate(true).raw.toString('base64'), 64));
        });


        req.end();
    })


});