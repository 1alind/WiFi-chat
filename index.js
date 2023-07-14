function localip() {
  let os = require('os');
  let i = Object.values(os.networkInterfaces())
    .flat()
    .find(x => x.address.startsWith('192.168'));
  if (i) {
    return i['cidr'].split('/')[0];
  }
}
localip();
const http = require('http');
const fs = require('fs');
const online = {};
const server = http.createServer();
var url = require('url');
const msgdb = {};
function s(i) {
  console.log(i);
}
const port = 3000;
server.on('request', async (req, res) => {
  if (req.method === 'GET') {
    let preq = url.parse(req.url).pathname;
    const t = Date.now();
    const diff = 20000;
    for (const k in online) {
      if (t - online[k] > diff) delete online[k];
    }
    online[req.socket.remoteAddress.split(':')[3]] = Date.now()
    if (preq === "/qr.png") {
      async function f() {
        const QRCode = require('qrcode');
        let qrlink = "http://" + localip() + ":" + port;
        let fname = "qr.png";
        await QRCode.toFile(fname, qrlink);
        let j = await fs.readFileSync(fname);
        res.writeHead(200, {
          'Content-Type': 'image.png'
        });
        res.end(j);
      }
      f();
    } else if (preq === "/myip") {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end(req.socket.remoteAddress.split(':')[3]);
    } else if (preq === '/online') {
      const i = Object.keys(online);
      const y = req.socket.remoteAddress.split(':')[3];
      const fips = i.filter(x => x !== y);
      res.writeHead(200, {
        'Content-Type': 'text/json'
      });
      res.end(JSON.stringify(fips))
    } else if (preq === "/sendmsg") {
      let hc = url.parse(req.url, true).query;
      let senderipm = req.socket.remoteAddress.split(':')[3];
      let senderip = senderipm.replace(/\./g, "").toString();
      let receiverip = hc.ip.replace(/\./g, "");
      let msgcon = hc.msg;
      let cidg = [senderip, receiverip].sort((a, b) => b - a);
      const cid = cidg[0] + cidg[1];
      if (!msgdb[cid]) {
        msgdb[cid] = [];
      }
      msgdb[cid].push({
        msgcon,
        senderipm
      });
    } else if (preq === "/getmsgs") {
      let ipo = url.parse(req.url, true).query.ip.replace(/\./g, "");
      let ipt = req.socket.remoteAddress.split(':')[3].replace(/\./g, "");
      let ipidf = [ipo, ipt].sort((a, b) => b - a);
      let ipid = ipidf[0] + ipidf[1];
      if (!JSON.stringify(msgdb[ipid])) {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        res.end("nothing");
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/js'
        });
        res.end(JSON.stringify(msgdb[ipid]));
      }
    } else {
      const filePath = req.url === '/' ? '/index.html' : req.url;
      fs.readFile('index.html', 'utf8', (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Not Found');
        } else {
          res.setHeader('Content-Type', "text/html");
          res.end(data);
        }
      });
    }
  } else if (req.method === 'POST') {
    res.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    res.end('');
  }
});
// Start the server
server.listen(port, () => {
  s(localip() + ":" + port);
});