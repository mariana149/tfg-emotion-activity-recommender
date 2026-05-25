const express=require('express');
const path=require('path');
const userRoutes=require('./routes/userRoutes');
const emocionesRoutes=require('./routes/emocionesRoutes');
const activityLogRoutes=require('./routes/activityLogRoutes');
const savedRoutes=require('./routes/savedActivityRoutes');
const recommendationRoutes=require('./routes/recommendationRoutes');
const adminRoutes=require('./routes/adminRoutes');
const userActivitiesRoutes = require('./routes/userActivitiesRoutes');
const socialRoutes = require('./routes/socialRoutes');

const app=express();
const PORT=3000;

const session=require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore ({
    host: "localhost",
    user: "root",
    password: "",
    database: "tfg"
});

const middlewareSession = session({
    saveUninitialized: false,
    secret: "tfg",
    resave: false,
    store: sessionStore,
    cookie: {
    httpOnly: true,
    secure: false 
    }
});

app.use(middlewareSession);
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, 'views'));
app.use('/', userRoutes);
app.use('/', emocionesRoutes);
app.use('/', activityLogRoutes);
app.use('/', savedRoutes);
app.use('/', recommendationRoutes);
app.use('/', adminRoutes);
app.use('/', userActivitiesRoutes);
app.use('/', socialRoutes);

app.listen(PORT,()=>{
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});