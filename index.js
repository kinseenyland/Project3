let express = require("express");

let app = express();

let path = require("path");

// port we are listening on
const port = process.env.PORT || 3000;

// I want to use ejs
app.set("view engine", "ejs");


app.use(express.static(path.join(__dirname, 'bs/assets')))


//how it is going to parse data
app.use(express.urlencoded({ extended: true }));
// ??
// app.use(express.json());

//Our server from postgres we will be using
const knex = require("knex")({
    client: "pg",
    connection: {
        host: "awseb-e-k96uvadenp-stack-awsebrdsdatabase-mxtdqccvequw.chbjz0hu5jhn.us-east-1.rds.amazonaws.com" || "localhost",
        user: process.env.RDS_USERNAME || "ebroot",
        password: process.env.RDS_PASSWORD || "happykira",
        database: process.env.RDS_DB_NAME || "ebdb",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});



// random route to landing page
app.get("/", (req, res) => {
    res.render('index');
});


// random route to Modify page
app.get("/modifyaccount", (req, res) => {
    res.render('modifyAccount');
});

// random route to Create page
app.get("/createaccount", (req, res) => {
    res.render('createAccount');
});

// random route to Landing 2 page
app.get("/admin", (req, res) => {
    res.render('adminLanding');
});

// // random route to Record form page (add a record) TO FIX
app.get("/", (req, res) => {
    knex.select().from("login").then(user => {
        res.render('index', { users: user });
    })
});

// **********************************************ADMIN RELATED PATH*********************************************
//DATA and route FROM PG TO THE ADMIN RECORD PAGE 
app.get("/adminRecords", (req, res) => {
    knex.select('*')
        .from('Apartments')
        .then(chicks => {
            // adminRecords is a html page that it shows the table, the second parameter is the data
            res.render("adminRecords", { adminInfo: chicks });
        })
});


//Search record on the admin records page
app.get("/adminRecords/:ApartmentName", (req, res) => {

    const parameterFromPage = req.query.ApartmentName
    knex.select('*')
        .from('Apartments')
        .where('Apartments.ApartmentName', parameterFromPage)
        .then(specificGuy => {
            res.render("searchResults", { Dude: specificGuy });

        }).catch(err => {
            console.log(err);
            res.status(500).json({ err });

        });
});

// ***********************************************LOGIN RELATED PATHS****************************************

// random route to Login page
app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/badLogin", (req, res) => {
    res.render("badLogin", {})
});


app.post("/login", (req, res) => {
    const username = req.body.username
    const password = req.body.password

    knex("login").where("username", username).andWhere("password", password).returning("user_id").then((response) => {

        if (response.length == 0) {
            res.redirect("badLogin");
            return;
        }

        res.redirect("adminLanding");
    });
});

app.get("/findUsername", (req, res) => {
    res.render("findUsername", {});
});

app.post("/createAccount", (req, res) => {
    knex("login").insert({ username: req.body.username, password: req.body.password }).then(users => {
        res.redirect("/login");
    }).catch(err => {
        console.log(err);
        res.status(500).json({ err });
    });
});

app.post("/findUsername", (req, res) => {
    knex.select().from("login").where("username", req.body.username).then(user => {
        res.render("modifyAccount", { users: user })
    });
});

app.post("/modifyAccount", (req, res) => {
    knex("login").where("user_id", parseInt(req.body.user_id)).update({
        username: req.body.username,
        password: req.body.password
    }).then(users => {
        res.redirect("/login");
    });
});
// ******************************************LANDING PAGES PATHS**************************************************
app.get("/adminLanding", (req, res) => {
    res.render("adminLanding", {});
});

// **************************************SURVEY RELATED PATHS****************************************

app.get("/survey", (req, res) => {
    res.render("survey", {});
});

app.post("/survey", (req, res) => {
    // Insert data into the Respondent table
    knex("Apartments")
        .insert(
            {
                ApartmentName: req.body.name,
                MonthlyRent: req.body.rent,
                StreetAddress: req.body.address,
                City: req.body.city,
                Zip: parseInt(req.body.zip),
                State: 'UT',
                Bedrooms: parseInt(req.body.bedrooms),
                RoomType: req.body.roomType,
                Pets: req.body.pets,
                Rating: parseInt(req.body.rating)
            }).then((response) => {
                res.redirect("/thanks");
            })
})

// Route to the thank you page
app.get("/thanks", (req, res) => {
    res.render('thankyouSurvey');
});

// **********************************************CRUD***********************************************
// Add a new route for deletion
app.post("/deleteRecord/:ApartmentID", (req, res) => {
    const apartmentID = req.params.ApartmentID;

    // Perform deletion based on ApartmentID
    knex("Apartments")
        .where({ "ApartmentID": apartmentID })
        .del()
        .then(() => {
            knex("Apartments").where({ "ApartmentID": apartmentID }).del().then(() => {
                res.redirect("/adminRecords");
            })
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Internal Server Error");
        });
});



app.get("/editRecord/:ApartmentID", (req, res) => {
    const ApartmentID = req.params.ApartmentID;
    knex.select(
        "ApartmentName",
        "MonthlyRent",
        "StreetAddress",
        "City",
        "Zip",
        "Bedrooms",
        "RoomType",
        "Pets",
        "Rating")
        .from("Apartments").where("ApartmentID", ApartmentID).then(Dude => {
            res.render("editRecord", { Dude: Dude, ApartmentID: ApartmentID })
        }).catch(err => {
            console.log(err);
            res.status(500).json({ err });
        })
});
app.post("/editRecord/:ApartmentID", (req, res) => {
    const ApartmentID = req.params.ApartmentID;
    // Update the user information
    knex("Apartments")
        .where("ApartmentID", ApartmentID)
        .update({
            ApartmentName: req.body.name,
            MonthlyRent: req.body.rent,
            StreetAddress: req.body.address,
            City: req.body.city,
            Zip: parseInt(req.body.zip),
            Bedrooms: parseInt(req.body.bedrooms),
            RoomType: req.body.roomType,
            Pets: req.body.pets,
            Rating: parseInt(req.body.rating)
        })
        .then(updatedUserInfo => {
            // Render the editUser view with the updated user information
            res.render("index", { ApartmentID: ApartmentID });
        }).catch(err => {
            console.log(err);
            res.status(500).json({ err });
        });
});




// Start the server listening (do it at the bottom)
app.listen(port, () => console.log("Server is listening"));
