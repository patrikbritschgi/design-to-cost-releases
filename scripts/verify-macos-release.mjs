import {readFile,readdir,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash,createPublicKey,verify} from 'node:crypto';
import path from 'node:path';
export async function verifyMacRelease(folder,keyFile,tag){
 if(!/^mac-v\d+\.\d+\.\d+$/.test(tag))throw Error('Stable Mac tag required');
 const bytes=await readFile(path.join(folder,'update-manifest.json'));if(bytes.length>262144)throw Error('Manifest too large');const e=JSON.parse(bytes);if(e.schema!==1||e.key_id!=='dtc-release-2026-01')throw Error('Unknown key');
 const raw=Buffer.from((await readFile(keyFile,'utf8')).trim(),'base64');if(raw.length!==32)throw Error('Invalid key');const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),raw]),format:'der',type:'spki'});const payload=Buffer.from(e.payload,'base64');if(!verify(null,payload,key,Buffer.from(e.signature,'base64')))throw Error('Signature mismatch');const m=JSON.parse(payload);
 if(m.schema!==1||m.app_id!=='ch.designtocost.macos'||m.target!=='macos-universal'||m.channel!=='stable'||tag!==`mac-v${m.version}`||!/^\d+\.\d+\.\d+$/.test(m.version)||!/^[a-f0-9]{40}$/.test(m.source_commit))throw Error('Mac identity mismatch');
 if(!Array.isArray(m.files)||m.files.length>2048||m.files.some(n=>!n.startsWith('Contents/')||n.includes('..')||n.includes('\\')||n.includes(':')||n.toLowerCase().includes('.dtcost'))||new Set(m.files.map(n=>n.toLowerCase())).size!==m.files.length)throw Error('Invalid Mac inventory');
 const expected=new Set(['BUILD.json','README.md','TEST-SUMMARY.json','SHA256SUMS.txt','update-manifest.json','update-manifest.sig']);
 async function digest(file){const h=createHash('sha256');for await(const c of createReadStream(file))h.update(c);return h.digest('hex')}
 if(Object.keys(m.packages||{}).sort().join(',')!=='disk_image,macos')throw Error('Both Mac downloads must be signed');
 for(const [kind,extension]of [['macos','zip'],['disk_image','dmg']]){const a=m.packages[kind];if(a.name!==`Design-to-Cost-${m.version}-macOS-universal.${extension}`||a.url!==`https://github.com/patrikbritschgi/design-to-cost-releases/releases/download/${tag}/${a.name}`||a.size<1||a.size>1500000000)throw Error('Unexpected Mac asset');const file=path.join(folder,a.name);if((await stat(file)).size!==a.size||await digest(file)!==a.sha256)throw Error('Mac asset mismatch');expected.add(a.name)}
 const names=await readdir(folder);if(names.length!==expected.size||names.some(n=>!expected.has(n)))throw Error('Unexpected public files');if((await readFile(path.join(folder,'update-manifest.sig'),'utf8')).trim()!==e.signature)throw Error('Detached signature mismatch');
 const covered=new Set();for(const line of (await readFile(path.join(folder,'SHA256SUMS.txt'),'utf8')).trim().split(/\r?\n/)){const a=/^([a-f0-9]{64})  ([^/\\]+)$/.exec(line);if(!a||!expected.has(a[2])||a[2]==='SHA256SUMS.txt'||covered.has(a[2])||await digest(path.join(folder,a[2]))!==a[1])throw Error('Checksum mismatch');covered.add(a[2])}if(covered.size!==expected.size-1)throw Error('Incomplete checksums');
 const build=JSON.parse(await readFile(path.join(folder,'BUILD.json'),'utf8')),tests=JSON.parse(await readFile(path.join(folder,'TEST-SUMMARY.json'),'utf8'));
 if(build.version!==m.version||build.source_commit!==m.source_commit||build.target!=='macos-universal'||build.bundle_signature!=='ad-hoc'||build.developer_id!==false||build.notarized!==false||tests.version!==m.version||tests.source_commit!==m.source_commit||tests.platform!=='macos')throw Error('Build identity mismatch');
 if(Object.keys(build).some(k=>!['version','source_commit','target','minimum_macos','bundle_signature','developer_id','notarized','update_verification','binaries'].includes(k))||Object.keys(tests).some(k=>!['version','source_commit','platform','no_admin','offline','native_window','architectures'].includes(k)))throw Error('Unexpected public metadata');
 if(!tests.no_admin||!tests.offline||!tests.native_window||Object.keys(tests.architectures||{}).sort().join(',')!=='arm64,x64')throw Error('Both Mac architectures must pass');
 for(const cases of Object.values(tests.architectures)){if(Object.keys(cases).length<25||Object.entries(cases).some(([k,v])=>!/^[_a-z0-9]+$/.test(k)||v!==true))throw Error('Incomplete Mac acceptance')}
 if(/\/Users\/|C:\\\\Users\\\\/i.test(JSON.stringify(build)+JSON.stringify(tests)))throw Error('Private paths in public metadata');return m;
}
