require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');

//setting up your port
const PORT = process.env.PORT || 8080

//assigning the variable app to express
const app = express()

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// //synchronizing the database and forcing it to false so we dont lose data
// db.sequelize.sync({ alter: true }).then(() => {
//     console.log("db has been re sync")
// })

app.use(passport.initialize());
require("./middlewares/jwt")(passport);

require('./routes/index')(app);

//listening to server connection
app.listen(PORT, () => console.log(`Server is running on ${PORT}`))
