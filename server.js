const express=require('express'),{Pool}=require('pg'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const S=process.env.JWT_SECRET;if(!S){console.error('JWT_SECRET manquant');process.exit(1)}
const db=process.env.DATABASE_URL;
const pool=new Pool({connectionString:db,options:'-c search_path=nafa',ssl:db&&!/localhost|127\.0\.0\.1/.test(db)?{rejectUnauthorized:false}:false});
const q=(t,p)=>pool.query(t,p);
const app=express();app.use(express.json({limit:'100kb'}));
const h=f=>(req,res)=>f(req,res).catch(e=>{console.error(e);res.status(500).json({error:'Erreur serveur'})});
const auth=role=>(req,res,next)=>{try{const t=(req.headers.authorization||'').slice(7);const u=jwt.verify(t,S);if(role&&u.role!==role)return res.status(403).json({error:'Accès refusé'});req.u=u;next()}catch(e){res.status(401).json({error:'auth'})}};
const tok=u=>jwt.sign({id:u.id,role:u.role},S,{expiresIn:'7d'});
const ph=s=>String(s||'').replace(/[^\d+]/g,'');
async function init(){
 await q('CREATE SCHEMA IF NOT EXISTS nafa');
 await q(`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,name TEXT NOT NULL,phone TEXT UNIQUE NOT NULL,pass TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',birth TEXT,sex TEXT,created TIMESTAMPTZ DEFAULT now());
 CREATE TABLE IF NOT EXISTS groups(id SERIAL PRIMARY KEY,name TEXT NOT NULL,members INT DEFAULT 0,amount INT NOT NULL);
 CREATE TABLE IF NOT EXISTS payments(id SERIAL PRIMARY KEY,user_id INT REFERENCES users(id),group_id INT REFERENCES groups(id),amount INT NOT NULL,fee INT NOT NULL,method TEXT,status TEXT NOT NULL DEFAULT 'pending',created TIMESTAMPTZ DEFAULT now());
 CREATE TABLE IF NOT EXISTS notifications(id SERIAL PRIMARY KEY,title TEXT,body TEXT,created TIMESTAMPTZ DEFAULT now());`);
 if(!(await q('SELECT 1 FROM groups LIMIT 1')).rowCount)for(const g of [['Groupe Solidarité',12,500],['Groupe Projets',18,1000],['Traoré Épargne Plus',15,1000],['Groupe Avenir',10,2000],['Groupe Famille',8,5000]])await q('INSERT INTO groups(name,members,amount) VALUES($1,$2,$3)',g);
 if(process.env.ADMIN_PHONE&&process.env.ADMIN_PASSWORD)await q("INSERT INTO users(name,phone,pass,role) VALUES('Administrateur',$1,$2,'admin') ON CONFLICT(phone) DO UPDATE SET role='admin',pass=$2",[ph(process.env.ADMIN_PHONE),await bcrypt.hash(process.env.ADMIN_PASSWORD,10)]);
}
app.post('/api/register',h(async(req,res)=>{const{name,password,birth,sex}=req.body,phone=ph(req.body.phone);
 if(!name||name.length<3||phone.length<8||!password||password.length<6)return res.status(400).json({error:'Nom, téléphone (8 chiffres min.) et mot de passe (6 caractères min.) requis'});
 try{const r=await q('INSERT INTO users(name,phone,pass,birth,sex) VALUES($1,$2,$3,$4,$5) RETURNING id,role',[name.trim(),phone,await bcrypt.hash(password,10),birth||null,sex||null]);
  await q('INSERT INTO notifications(title,body) VALUES($1,$2)',['Nouveau membre inscrit',name.trim()]);res.json({token:tok(r.rows[0])})}
 catch(e){if(e.code==='23505')return res.status(409).json({error:'Ce numéro est déjà inscrit'});throw e}}));
app.post('/api/login',h(async(req,res)=>{const r=await q('SELECT * FROM users WHERE phone=$1',[ph(req.body.phone)]);const u=r.rows[0];
 if(!u||!(await bcrypt.compare(String(req.body.password||''),u.pass)))return res.status(400).json({error:'Numéro ou mot de passe incorrect'});res.json({token:tok(u),role:u.role})}));
app.get('/api/me',auth(),h(async(req,res)=>{const r=await q('SELECT id,name,phone,role FROM users WHERE id=$1',[req.u.id]);if(!r.rowCount)return res.status(401).json({error:'auth'});res.json(r.rows[0])}));
app.get('/api/groups',auth(),h(async(req,res)=>res.json((await q('SELECT * FROM groups ORDER BY id')).rows)));
app.post('/api/pay',auth(),h(async(req,res)=>{const amount=parseInt(req.body.amount,10),gid=parseInt(req.body.group_id,10),method=String(req.body.method||'');
 if(!(amount>=100&&amount<=1000000)||!['Orange Money','MTN Money','Wave'].includes(method)||!(await q('SELECT 1 FROM groups WHERE id=$1',[gid])).rowCount)return res.status(400).json({error:'Montant (min. 100 FCFA), groupe et moyen de paiement requis'});
 const fee=Math.round(amount*0.02);await q('INSERT INTO payments(user_id,group_id,amount,fee,method) VALUES($1,$2,$3,$4,$5)',[req.u.id,gid,amount,fee,method]);
 await q('INSERT INTO notifications(title,body) VALUES($1,$2)',['Paiement reçu',method+' · '+amount+' FCFA']);res.json({ok:true,total:amount+fee})}));
app.get('/api/transactions',auth(),h(async(req,res)=>res.json((await q('SELECT p.id,p.amount,p.fee,p.method,p.status,p.created,g.name AS group_name FROM payments p JOIN groups g ON g.id=p.group_id WHERE p.user_id=$1 ORDER BY p.id DESC LIMIT 100',[req.u.id])).rows)));
const adm=auth('admin');
app.get('/api/admin/stats',adm,h(async(req,res)=>{const r=await q("SELECT (SELECT count(*) FROM users WHERE role='member')::int members,(SELECT count(*) FROM groups)::int groups,(SELECT coalesce(sum(amount),0) FROM payments WHERE status='validated')::int total,(SELECT count(*) FROM payments WHERE status='pending')::int pending");res.json(r.rows[0])}));
app.get('/api/admin/members',adm,h(async(req,res)=>res.json((await q("SELECT id,name,phone,created FROM users WHERE role='member' ORDER BY id DESC LIMIT 200")).rows)));
app.get('/api/admin/payments',adm,h(async(req,res)=>res.json((await q("SELECT p.id,p.amount,p.method,p.created,u.name,g.name AS group_name FROM payments p JOIN users u ON u.id=p.user_id JOIN groups g ON g.id=p.group_id WHERE p.status='pending' ORDER BY p.id")).rows)));
app.post('/api/admin/payments/:id/:act',adm,h(async(req,res)=>{const st={validate:'validated',refuse:'refused'}[req.params.act];if(!st)return res.status(404).json({error:'Action inconnue'});
 const r=await q("UPDATE payments SET status=$1 WHERE id=$2 AND status='pending' RETURNING id",[st,parseInt(req.params.id,10)]);if(!r.rowCount)return res.status(409).json({error:'Paiement déjà traité'});res.json({ok:true})}));
app.get('/api/admin/notifications',adm,h(async(req,res)=>res.json((await q('SELECT title,body,created FROM notifications ORDER BY id DESC LIMIT 50')).rows)));
app.use(express.static('public'));
init().then(()=>app.listen(process.env.PORT||3000,()=>console.log('Nafa Finance prêt'))).catch(e=>{console.error(e);process.exit(1)});
