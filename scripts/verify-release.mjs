// Public-repository verifier: built-in Node modules only, no private source access.
import {readFile,stat,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash,createPublicKey,verify} from 'node:crypto';
import path from 'node:path';
export async function verifyRelease(folder,keyFile,tag){
 if(!/^v\d+\.\d+\.\d+$/.test(tag))throw new Error('Stable release tag required');
 const bytes=await readFile(path.join(folder,'update-manifest.json'));
 if(bytes.length>262144)throw new Error('Manifest too large');
 const envelope=JSON.parse(bytes);if(envelope.schema!==1||envelope.key_id!=='dtc-release-2026-01')throw new Error('Unknown signing key');
 const key=Buffer.from((await readFile(keyFile,'utf8')).trim(),'base64');if(key.length!==32)throw new Error('Invalid public key');
 const publicKey=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),key]),type:'spki',format:'der'});
 const payload=Buffer.from(envelope.payload,'base64');
 if(!verify(null,payload,publicKey,Buffer.from(envelope.signature,'base64')))throw new Error('Signature mismatch');
 const m=JSON.parse(payload);
 if(m.schema!==1||m.app_id!=='ch.designtocost.windows'||m.target!=='windows-x64'||m.channel!=='stable'||`v${m.version}`!==tag)throw new Error('Manifest and release do not match');
 const expected=new Set(['BUILD.json','README.md','TEST-SUMMARY.json','SHA256SUMS.txt','update-manifest.json','update-manifest.sig']);
 async function digest(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')}
 for(const [kind,suffix]of [['installer','Windows-x64-Setup.exe'],['portable','Windows-App-x64-portable.zip']]){
  const a=m.packages[kind];if(a.name!==`Design-to-Cost-${m.version}-${suffix}`||a.url!==`https://github.com/patrikbritschgi/design-to-cost-releases/releases/download/${tag}/${a.name}`)throw new Error('Unexpected release asset');
  const file=path.join(folder,a.name);if((await stat(file)).size!==a.size||await digest(file)!==a.sha256)throw new Error('Release asset digest mismatch');expected.add(a.name);
 }
 const present=await readdir(folder);if(present.length!==expected.size||present.some(n=>!expected.has(n)))throw new Error('Unexpected public files');
 if((await readFile(path.join(folder,'update-manifest.sig'),'utf8')).trim()!==envelope.signature)throw new Error('Signature file mismatch');
 const covered=new Set();
 for(const line of (await readFile(path.join(folder,'SHA256SUMS.txt'),'utf8')).trim().split(/\r?\n/)){
  const match=/^([a-f0-9]{64})  ([^/\\]+)$/.exec(line);if(!match||!expected.has(match[2])||match[2]==='SHA256SUMS.txt'||covered.has(match[2])||await digest(path.join(folder,match[2]))!==match[1])throw new Error('Checksum file mismatch');covered.add(match[2]);
 }
 if(covered.size!==expected.size-1)throw new Error('Incomplete checksum file');
 const build=JSON.parse(await readFile(path.join(folder,'BUILD.json'),'utf8')),tests=JSON.parse(await readFile(path.join(folder,'TEST-SUMMARY.json'),'utf8'));
 const dashboardTests=['dashboard_no_group_card','four_theme_dashboard','dashboard_zoom_200_layout'];
 const allowedTests=new Set(['version','source_commit','environment','rust_tests_passed','frontend_tests_passed','native_window','offline','no_admin','updates','digitally_signed',...dashboardTests]);
 if(Object.keys(tests).some(k=>!allowedTests.has(k))||!tests.rust_tests_passed||!tests.frontend_tests_passed||Object.keys(tests.updates||{}).length<20||Object.entries(tests.updates||{}).some(([k,v])=>!/^[_a-z0-9]+$/.test(k)||v!==true))throw new Error('Incomplete or unexpected public test summary');
 // Earlier immutable releases predate these fields. From 1.3.2 onward the
 // three actual dashboard checks are mandatory, and must be true when present.
 const [major,minor,patch]=m.version.split('.').map(Number);
 const dashboardRequired=major>1||(major===1&&(minor>3||(minor===3&&patch>=2)));
 if(dashboardTests.some(k=>(dashboardRequired||k in tests)&&tests[k]!==true))throw new Error('Complete dashboard evidence required');
 const allowedBuild=new Set(['version','target','source_commit','features','release_optimization','release_lto','digitally_signed','update_verification','runtime','binaries']);
 if(Object.keys(build).some(k=>!allowedBuild.has(k))||build.source_commit!==m.source_commit||build.version!==m.version||tests.version!==m.version||tests.source_commit!==m.source_commit||!tests.no_admin||!tests.offline||!tests.native_window||!tests.updates||!Object.values(tests.updates).every(Boolean))throw new Error('Public build evidence mismatch');
 if(/C:\\\\Users\\\\|\/Users\//i.test(JSON.stringify(build)+JSON.stringify(tests)))throw new Error('Private build paths must not be published');
 return m;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const manifest=await verifyRelease(process.argv[2],process.argv[3],process.argv[4]);console.log(JSON.stringify({verified:true,version:manifest.version,source_commit:manifest.source_commit}));
}
