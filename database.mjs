import {createClient} from '@libsql/client';
import {AsyncLocalStorage} from 'node:async_hooks';
import {mkdir} from 'node:fs/promises';
const scope=new AsyncLocalStorage();
export async function openDatabase(root){
 const remote=process.env.TURSO_DATABASE_URL;
 if(process.env.VERCEL&&(!remote||!process.env.TURSO_AUTH_TOKEN))throw new Error('Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel.');
 if(!remote)await mkdir(`${root}/data`,{recursive:true});
 const client=createClient({url:remote||`file:${root}/data/leads.sqlite`,authToken:process.env.TURSO_AUTH_TOKEN});
 const target=()=>scope.getStore()||client;
 return {
 exec:sql=>target().executeMultiple(sql),
 prepare:sql=>({all:async(...args)=>(await target().execute({sql,args})).rows,get:async(...args)=>(await target().execute({sql,args})).rows[0],run:async(...args)=>({changes:(await target().execute({sql,args})).rowsAffected}) }),
 transaction:async fn=>{const tx=await client.transaction('write');try{const result=await scope.run(tx,fn);if(result.error)await tx.rollback();else await tx.commit();return result;}catch(e){await tx.rollback();throw e;}finally{tx.close();}},
 close:()=>client.close()
 };
}
