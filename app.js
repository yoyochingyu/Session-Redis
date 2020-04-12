const express = require("express"),
						app = express(),
						session = require('express-session'),
						bodyParser = require("body-parser"),
						redis = require("redis"),
						redisClient = redis.createClient();

// APP CONFIG
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

// Redis connection
redisClient.on('connect',()=>{
	console.log('Redis server has started!');
})
redisClient.on("error",(err)=>{
	console.log(err);
});

// Session settings
app.use(session({
	cookie:{maxAge:600000}, // 10 mins
	name:'cookie8080', // sign之前的 cookie name(=sessionID)<-->Browser那端看到的事signed的cookie
	resave:false,
	saveUninitialized:false,
	secret:'Mary has a little doll'
}));

//===========================
// Routes
//===========================

app.get("/",(req,res)=>{
	if(req.session.user){
		var userInfo = {
			views:req.session.views,
			name:req.session.user
		};
	}
	res.render("index",{userInfo:userInfo});
});

app.get("/register",(req,res)=>{
	res.render("register");
});

app.get("/login",(req,res)=>{
	res.render("login");
});

app.post("/register",(req,res)=>{
	let email = req.body.email;
	let password = req.body.password;
	redisClient.hmset(`${email}`,'password',`${password}`,'views',0,(err)=>{
		if(err){
			console.log(err);
		}
		else{
			res.redirect("/");
		}
	}); 
});


app.post("/login",(req,res)=>{
	let inputEmail = req.body.email;
	let inputPassword = req.body.password;
	redisClient.hgetall(`${inputEmail}`,(err,result)=>{ // Search redis with inputEmail to see if there's record in redis
		if(err){
			console.log(err);
		}
		else{
			if(result==null){ // Null means can't find anyone with this email in redis
				res.send("User not found!");
			}
			else{ // Found this user in the redis database, next:compare input password
				if(result.password === inputPassword){ // password is valid, start **session **
					req.session.user = inputEmail; // write session data in Server side(default : memStore)
					if(result.views == 0){ //Use double equal because redis save data with **string!!!**
						req.session.views = 1;
					}
					else{
						req.session.views=parseInt(result.views)+1;
					}
					redisClient.hincrby(`${inputEmail}`,'views',1,(err)=>{ //save views to redis
						if(err){
							console.log(err);
						}
					});
					res.redirect("/");
				}
				else{
					res.send("Wrong Password!");
				}
			}
		}
	});
});

app.get("/logout",(req,res)=>{
	req.session.user=null;
	req.session.views = 0;
	res.redirect("/");
});

app.listen(8080,()=>{
		console.log("Server has started!");
});