import { HandyDVPN } from './HandyDvpn.js';
import { CommonUtils } from './CommonUtils.js';
import { Server } from "socket.io";
import fs from 'fs';

export class APIHelper {
	constructor() {
		this.initPorts();
		this.utils = new CommonUtils();
		this.dvpn = new HandyDVPN();
	}
	initSocketConnection(httpServer, serverName) {
		const io = new Server(httpServer);

		this.initDVPNSockets(io, serverName);
	}

	get(requestPath, requestBody) {
		return new Promise((resolve, reject) => {
			let positional = this.filterPositional(requestPath);

			if (positional[0] == 'api') {
				console.log('is positional', positional);
				//callback(null,{pos:positional});
				this.getAPIResponse(positional, requestBody, resolve, reject);
			}
			else {
				reject('request path not valid: ' + requestPath)
			}
		});

	}
	filterPositional(path) {
		let split = path.split('/');
		return split.filter(function (d) {
			if (d != '') return d;
		});
	}
	getAPIResponse(positional, requestBody, resolve, reject) {
		const path = positional.slice(1, positional.length);
		switch (path[0]) {
			case 'dvpn':
				this.dvpn.api(path, requestBody, resolve, reject);
				break;
			case 'getIP':
				this.utils.getIPForDisplay().then(data => {
					resolve(data);
				}).catch(error => {
					reject(error);
				})
				break;
			case 'updateHandyHost':
				this.utils.updateHandyHost().then(data => {
					resolve(data);
				}).catch(error => {
					reject(error);
				})
				break;
			//todo: other services
		}

	}
	initDVPNSockets(io, serverName) {
		this.dvpn.addSocketNamespace(io.of('/dvpn'), serverName);
	}
	initPorts() {
		//check if default ports redlist exists
		const appPortsFile = process.env.HOME + '/.HandyHost/ports.json';
		if (!fs.existsSync(appPortsFile)) {
			const ports = fs.readFileSync(process.env.PWD + '/reservedPortsDefault.json', 'utf8');
			fs.writeFileSync(appPortsFile, ports, 'utf8');
		}
	}

}