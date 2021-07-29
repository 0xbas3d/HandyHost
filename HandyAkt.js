import fs from 'fs';
import path from 'path';
import url from 'url';
import {spawn} from 'child_process';
import {AKTUtils} from './aktAPI/Utils.js';
import {DiskUtils} from './aktAPI/DiskUtils.js';
import {K8sUtils} from './aktAPI/K8sUtils.js';
import {Wallet} from './aktAPI/Wallet.js';
import {Marketplace} from './aktAPI/Marketplace.js';

export class HandyAKT{
	constructor(){
		
		this.clusterConfigFilePath = process.env.HOME+'/.HandyHost/aktData/clusterConfig.json';
		try{
			fs.mkdirSync(`${process.env.HOME}/.HandyHost/aktData`,{recursive:true})
		}
		catch(e){
			//folder already exists
		}
		let acctName;
		try{
			acctName = fs.readFileSync(`${process.env.HOME}/.HandyHost/aktData/.nodeEnv`,'utf8');
		}
		catch(e){}
		
		if(typeof acctName != "undefined"){
			process.env.AKT_ACCT_NAME = acctName.replace(/\n/g,'');
			//try startup here since we have already inited
		}
		
		this.utils = new AKTUtils(this.clusterConfigFilePath);
		this.diskUtils = new DiskUtils();
		this.k8sUtils = new K8sUtils(this.clusterConfigFilePath);
		this.wallet = new Wallet();
		this.market = new Marketplace();
	}
	addSocketNamespace(ioNamespace){
		//this.io.of('/dvpn')
		console.log('init akt sockets');
		this.ioNamespace = ioNamespace;
		this.ioNamespace.adapter.on("create-room", (room) => {
		  if(room.indexOf('akt') == 0){
		  	//start a Socket listener for this room
		  	this.initSocketListener(room);
		  }
		});

		this.ioNamespace.adapter.on("delete-room", (room) => {
		  console.log(`room deleted ${room}`);
		  if(room.indexOf('akt') == 0){
		  	//stop a Socket listener for this room
		  	this.removeSocketListener(room);
		  }
		});
		this.ioNamespace.adapter.on("join-room", (room, id) => {
		  console.log(`socket ${id} has joined room ${room}`);
		});
		this.ioNamespace.adapter.on("leave-room", (room, id) => {
		  console.log(`socket ${id} has left room ${room}`);
		});
		console.log('setup connection events');
		this.ioNamespace.on('connection',(socket)=>{
			console.log('new connection');
			this.addSocketConnection(socket);
		});
	}
	addSocketConnection(socket){
		console.log('add socket connection');
		socket.emit('register');
		socket.on('subscribe',()=>{
			console.log('socket did subscribe');
			socket.join('akt');
		})

	}
	initSocketListener(room){
		//TODO: add when we get more stats on nodes..
		/*if(typeof this.socketRoomInterval == "undefined"){
			//spin up an interval to send out stats
			this.socketRoomInterval = setInterval(()=>{
				this.sendSocketUpdates();
			},60000);
		}*/
	}
	removeSocketListener(room){
		//everybody left the room, kill the update interval
		/*clearInterval(this.socketRoomInterval);
		delete this.socketRoomInterval;*/
	}
	sendSocketUpdates(){
		/*
		this.ioNamespace.to('dvpn').emit('update',{
			chain:chainData,
			wallet:walletData,
			daemon: versionD
		});
		*/
	}
	api(path,requestBody,resolve,reject){
		switch(`${path[1]}`){
			
			case 'getState':
				//check if its installed
				this.wallet.getState().then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getHosts':
				this.getClusterConfig().then(configData=>{
					this.utils.getHosts(configData).then(data=>{
						resolve(data);
					}).catch(error=>{
						reject(error);
					})
				});
				
			break;
			case 'initWallet':
				this.initWallet(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getWallets':
				this.getWallets(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getClusterConfig':
				this.getClusterConfig().then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'saveClusterConfig':
				this.saveClusterConfig(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'enableSSHForNode':
				this.enableSSHForNode(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getDisks':
				this.getDisks(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'addDisk':
				this.addDisk(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'generateKubernetesInventory':
				this.generateKubernetesInventory(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getUbuntuUSBDisks':
				this.diskUtils.getUbuntuUSBNVMe().then(usbs=>{
					resolve(usbs);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'configureNVMe':
				//path,hostname
				this.generateUbuntuCloudInit(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject({error});
				});
			break;
			case 'getClusterStats':
				this.getClusterStats().then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getK8sStats':
				this.k8sUtils.getClusterStats().then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getProviderDetail':
				this.k8sUtils.getProviderDetail().then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getGlobalIP':
				this.k8sUtils.getGlobalIP().then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'updateProviderRegistration':
			case 'createProviderRegistration':
				let mode = path[1] == 'updateProviderRegistration' ? 'update' : 'create';
				this.registerProvider(requestBody,mode).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'generateServerCert':
				this.generateServerCert(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			break;
			case 'getMarketplaceOrders':
				this.getMarketOrders(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
			case 'getMarketplaceBids':
				this.getMarketBids(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			break;
			case 'getMarketplaceLeases':
				this.getMarketLeases(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			break;
			case 'runProvider':
				this.runProvider(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			break;
			case 'createBid':
				this.createOrCancelBid(requestBody,'create').then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			break;
			case 'cancelBid':
				this.createOrCancelBid(requestBody,'cancel').then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			break;
			case 'fetchAllOrderBids':
				this.fetchAllOrderBids(requestBody).then(data=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				});
			break;
		}
		
	}
	fetchAllOrderBids(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return this.market.fetchAllOrderBids(parsed.bid,parsed.params);
	}
	createOrCancelBid(requestBody,mode){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		const walletName = this.getProviderWalletName();
		if(mode == 'create'){
			return this.market.createBid(parsed,walletName);
		}
		if(mode == 'cancel'){
			return this.market.cancelBid(parsed,walletName);
		}
	}

	runProvider(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return new Promise((resolve,reject)=>{
			this.wallet.checkProviderUpStatus().then(()=>{
				console.log('node is up');

				resolve({active:true});
				
			}).catch(err=>{
				//throws error when node isnt up
				this.getClusterStats().then(statsOut=>{
					console.log('shold run? ',statsOut.providerIsRegistered && statsOut.providerHasGeneratedCert);
					if(statsOut.providerIsRegistered && statsOut.providerHasGeneratedCert){
						//we should auto start this node then..
						const params = {
							serverHost: this.getProviderHost(),
							walletName: this.getProviderWalletName(),
							pw: parsed.pw
						}
						
						this.wallet.startProvider(params).then(response=>{
							if(response.success){
								resolve({active:true});
							}
							else{
								resolve({active:false,message:response.error})
							}
						})
						//params = walletName,serverHost,prob password????
					}
					else{
						resolve({active:false,message:'Provider is not registered and/or has not generated a provider certificate. Visit Cluster Status Page to remedy.'})
					}
				});
			})
		})
		

			
	}
	getMarketBids(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		const myWallet = this.getProviderWalletAddress();
		//console.log('bid data',params,wallet);
		return this.market.getBids(parsed,myWallet);
	}
	getMarketLeases(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		const myWallet = this.getProviderWalletAddress();
		//console.log('lease data',params,wallet);
		return this.market.getLeases(parsed,myWallet);
	}
	getMarketOrders(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return this.market.getOrders(parsed);
	}
	generateServerCert(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		const providerHost = this.getProviderHost();
		const walletAddress = this.getProviderWalletAddress();
		return this.wallet.createOrUpdateServerCertificate(parsed,walletAddress,providerHost);
	}
	registerProvider(requestBody,mode){
		/*
		{"height":"1840128","txhash":"DA91541C278ED8267241B8BEFD368EDD2728554D8551A78496853928E0138050","codespace":"provider","code":4,"data":"","raw_log":"failed to execute message; message index: 0: id: akash1mqnj2euks0aq82q0f2tknz6kua6zdfn97kmvhj: invalid provider: already exists","logs":[],"info":"","gas_wanted":"200000","gas_used":"52095","tx":null,"timestamp":""}

		*/
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		const providerHost = this.getProviderHost();
		return this.wallet.registerProvider(parsed,mode,providerHost);
	}
	getProviderWalletAddress(){
		const config = JSON.parse(fs.readFileSync(this.clusterConfigFilePath,'utf8'));
		return config.provider.providerWalletAddress;
	}
	getProviderHost(){
		const config = JSON.parse(fs.readFileSync(this.clusterConfigFilePath,'utf8'));
		return config.provider.providerIP;
	}
	getProviderWalletName(){
		const config = JSON.parse(fs.readFileSync(this.clusterConfigFilePath,'utf8'));
		return config.provider.providerWalletName;
	}
	getClusterStats(){
		return new Promise((resolve,reject)=>{
			const statsToFetch = 4;
			let statsFetched = 0;
			const statsOut = {};
			let providerIsRegistered = false; //TODO get fs.existsSync of something?
			let providerReceiptTX; 
			this.k8sUtils.getClusterStats().then(k8sStats=>{
				statsOut.k8s = k8sStats;
				statsFetched++;
				finish(statsFetched,statsToFetch,statsOut,resolve);
			});
			this.getClusterConfig().then(config=>{
				const numberNodes = config.nodes.length;
				const providerData = config.provider;
				statsOut.nodeCount = numberNodes;
				statsOut.providerData = providerData;
				statsOut.providerIsRegistered = providerIsRegistered;
				statsOut.providerHasGeneratedCert = fs.existsSync(process.env.HOME+'/.akash/'+providerData.providerWalletAddress+'.pem');
				if(fs.existsSync(process.env.HOME+'/.HandyHost/aktData/providerReceipt.'+providerData.providerWalletAddress+'.json')){
					const receipt = JSON.parse(fs.readFileSync(process.env.HOME+'/.HandyHost/aktData/providerReceipt.'+providerData.providerWalletAddress+'.json','utf8'))
					//https://www.mintscan.io/akash/txs/FB427B253030607DF2548F6C568F17D73E91A7E6CD962087F33360D68461A1F4
					const {tx,wallet} = this.wallet.getMetaFromTransaction(receipt);
					if(wallet == providerData.providerWalletAddress){
						statsOut.providerIsRegistered = true;
						statsOut.providerReceiptTX = tx;
					}
					
				};
				statsFetched++;
				finish(statsFetched,statsToFetch,statsOut,resolve);

				this.wallet.getBalance(providerData.providerWalletAddress).then(balance=>{
					statsOut.balance = balance;
					statsFetched++;
					finish(statsFetched,statsToFetch,statsOut,resolve);
				});
				this.wallet.checkProviderUpStatus().then(d=>{
					statsOut.providerIsRunning = true;
					statsFetched++;
					finish(statsFetched,statsToFetch,statsOut,resolve);
				}).catch(e=>{
					statsOut.providerIsRunning = false;
					statsFetched++;
					finish(statsFetched,statsToFetch,statsOut,resolve);
				})
			})

		})
		function finish(statsFetched,statsToFetch,statsOut,resolve){
			if(statsFetched == statsToFetch){
				resolve(statsOut);
			}
		}
	}
	generateUbuntuCloudInit(requestBody){
		//getHosts(existingConfigData)
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return new Promise((resolve,reject)=>{
			this.getClusterConfig().then(configData=>{
				this.utils.getHosts(configData).then(data=>{
					this.k8sUtils.generateUbuntuCloudInit(parsed,data).then(res=>{
						resolve(res);
					}).catch(error=>{
						reject(error);
					})
				}).catch(error=>{
					reject(error);
				})
			})
		})
	}
	generateKubernetesInventory(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return new Promise((resolve,reject)=>{
			this.utils.saveClusterConfig(parsed,this.clusterConfigFilePath).then(()=>{
				this.k8sUtils.createKubernetesInventory(this.clusterConfigFilePath,this.ioNamespace).then((data)=>{
					resolve(data);
				}).catch(error=>{
					reject(error);
				})
			})
		})
		
		
	}
	addDisk(requestBody){
		/*
		node:nodeData,
				disk
		*/
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return new Promise((resolve,reject)=>{
			//mounted
			this.diskUtils.addDisk(parsed.node,parsed.disk).then(data=>{
				if(data.mounted){
					this.getClusterConfig().then(config=>{
						if(typeof config.nodes != "undefined"){
							config.nodes.map(node=>{
								if(node.mac == parsed.node.mac){
									//update node
									node.diskConfigured = true;
								}
							})
							this.utils.saveClusterConfig(config,this.clusterConfigFilePath).then((done)=>{
								resolve({success:true,config});
							})
						}
					})
				}
				else{
					reject(data);
				}
			})
		})
	}
	getDisks(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return this.diskUtils.getDisks(parsed.node);
	}
	getClusterConfig(){
		return new Promise((resolve,reject)=>{
			const configFile = this.clusterConfigFilePath;
			if(fs.existsSync(configFile)){
				let json = JSON.parse(fs.readFileSync(configFile,'utf8'));
				console.log('json',json);
				if(typeof json.preConfiguredNVMe != "undefined" && typeof json.nodes != "undefined"){
					json.nodes.map(node=>{
						if(typeof json.preConfiguredNVMe[node.hostname.split('.')[0]] != "undefined"){
							node.sshConfigured = true;
							node.user = 'ansible';
						}
					});
				}
				resolve(json)
			}
			else{
				resolve({});
			}
		})
		
	}
	enableSSHForNode(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		console.log('enable ssh for node',parsed);
		return this.utils.enableSSHForNode(parsed.node,parsed.user,parsed.pw,this.clusterConfigFilePath);
		
	}
	saveClusterConfig(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return this.utils.saveClusterConfig(parsed,this.clusterConfigFilePath);
		
	}
	getWallets(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		return this.wallet.getKeyList(parsed.pw);
	}
	initWallet(requestBody){
		const {parsed,err} = this.parseRequestBody(requestBody);
		if(typeof parsed == "undefined"){
			return new Promise((resolve,reject)=>{
				reject(err);
			})
		}
		if(parsed.import){
			//init from seed
			return this.wallet.initWalletFromSeed(parsed.seed, parsed.pw, parsed.walletName);
		}
		else{
			return this.wallet.initWallet(parsed.pw, parsed.walletName);
		}
	}
	parseRequestBody(requestBody){
		let parsed;
		let err;
		try{
			parsed = JSON.parse(requestBody);
		}
		catch(e){
			err = e;
		}
		return {parsed,err};
	}
}