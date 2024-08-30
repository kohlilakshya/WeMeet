var express = require('express');
const multer = require("multer");
const File = require("./models/File");
var socket = require('socket.io');
const morgan = require('morgan');
const mongoose = require('mongoose');
const http = require('http');
const authRoutes = require('./routes/authroutes');
const passportSetup = require('./config/passport-setup');
const shortid = require('shortid');
const cookieSession = require('cookie-session');
const passport = require('passport');
require('dotenv').config();

// App setup
var app = express();
var server = http.Server(app);
const port = process.env.PORT || 3000;

// Connect to MongoDB and listen for requests
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log('connected to mongodb');
        server.listen(port, () => {
            console.log(`app now listening for requests on port ${port}`);
        });
    })
    .catch((err) => console.log(err));

// Static files and middleware
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const upload = multer({ dest: "uploads" });

// Session cookie setup
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY]
}));

// Register regenerate & save after the cookieSession middleware initialization
app.use((req, res, next) => {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => {
            cb();
        }
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => {
            cb();
        }
    }
    next();
});

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Home route
app.get("/", (req, res) => {
    res.render('home', { user: req.user });
});

// Auth routes
app.use('/auth', authRoutes);

// Room routes
app.get("/create", (req, res) => {
    res.redirect(`/${shortid.generate()}`);
});

app.get("/rej", (req, res) => {
    res.render('reject');
});

app.get("/:room", (req, res) => {
    res.render('mytry', { roomId: req.params.room, user: req.user });
});

// File route
app.post("/upload", upload.single('file'), async (req, res) => {
    console.log(req.file);
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    };
    const file = new File(fileData);
    file.save().then((result) => {
        res.json({ fileLink: `${req.headers.origin}/file/${file.id}` });
    });
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id);
    res.download(file.path, file.originalName);
}

// Socket setup & pass server
var admin = {};
var goo = {};
var io = socket(server);

io.on('connection', (socket) => {
    console.log('made socket connection', socket.id);
    socket.emit('your_id', socket.id);

    // Handle video events
    socket.on('join-room', (roomId, name, googleId) => {
        console.log(admin);
        if (!admin[roomId] || admin[roomId].length == 0) {
            admin[roomId] = new Set();
            goo[roomId] = new Set();
            goo[roomId].add(googleId);
            admin[roomId].add(socket.id);
            io.to(socket.id).emit('ok-join');
        } else if (goo[roomId].has(googleId)) {
            admin[roomId].add(socket.id);
            io.to(socket.id).emit('ok-join');
        } else {
            io.to(admin[roomId].values().next().value).emit('wants to join', name, socket.id, googleId);
        }

        socket.on('ok-join', (id, googs) => {
            io.to(id).emit('ok-join');
        });

        socket.on('reject', (id) => {
            io.to(id).emit('reject');
        });

        socket.on('join', (roomId, userId, googs) => {
            admin[roomId].add(socket.id);
            goo[roomId].add(googs);
            socket.join(roomId);
            socket.broadcast.to(roomId).emit('user-connected', userId);

            // Handle chat event
            socket.on('chat', function(data) {
                io.in(roomId).emit('chat', data);
            });

            socket.on('file', function(data) {
                io.in(roomId).emit('file', data);
            });

            socket.on('typing', (data) => {
                socket.broadcast.to(roomId).emit('typing', data);
            });

            // Whiteboard handler
            socket.on('draw', (data) => {
                socket.broadcast.to(roomId).emit('ondraw', { x: data.x, y: data.y });
            });

            socket.on('down', (data) => {
                socket.broadcast.emit('ondown', { x: data.x, y: data.y });
            });

            socket.on('disconnect', () => {
                admin[roomId].delete(socket.id);
                if (admin[roomId].size == 0) delete admin[roomId];
                socket.broadcast.to(roomId).emit('user-disconnected', userId);
            });
        });
    });
});

app.use((req, res) => {
    res.status(404).render('404', { title: 'About' });
});
