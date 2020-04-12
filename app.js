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
	name:'cookie8080', // cookie name
	resave:false,
	saveUninitialized:false,
	secret:'Mary has a little doll'
}));

//===========================
// Routes
//===========================

app.get("/",(req,res)=>{
	if(req.session.state == 1){
		var views = req.session.views;
	}
	res.render("index",{views:views});
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
	redisClient.set('userEmail',email,redis.print); //future modify: not only one user
	redisClient.set('userPassword',password,redis.print);
	res.redirect("/");
});


app.post("/login",(req,res)=>{
	let inputEmail = req.body.email;
	let inputPassword = req.body.password;
	redisClient.get('userEmail',(err,result)=>{ // 取出唯一一位使用者的email
		if(err){
			console.log(err);
		}
		else{
			if(result==inputEmail){ //進行比對
				redisClient.get('userPassword',(err,passwordResult)=>{ //取出唯一一位使用者的密碼
					if(err){
						console.log(err);
					}
					else{
						if(passwordResult==inputPassword){ //比對正確 //??
							req.session.state = 1; //已登入
							if(req.session.views){
								req.session.views++;
							}
							else{
								req.session.views = 1;//更改session狀態
							}
							res.redirect("/");
						}
						else{
							res.send("Wrong Password");
						}
					}
				})
			}
			else{
				res.send("You are not the only one user!");
			}
		}
	});
});

app.get("/logout",(req,res)=>{
	req.session.state=0;
	res.redirect("/");
});

app.listen(8080,()=>{
		console.log("Server has started!");
});