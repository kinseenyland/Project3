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
        host: "awseb-e-2wwqgezghp-stack-awsebrdsdatabase-ibek7zsxvhz9.chbjz0hu5jhn.us-east-1.rds.amazonaws.com" || "localhost",
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
    knex.select().from("user").then(user => {
        res.render('index', { users: user });
    })
});

// **********************************************ADMIN RELATED PATH*********************************************
//DATA and route FROM PG TO THE ADMIN RECORD PAGE 
app.get("/adminRecords", (req, res) => {
    knex.select('*')
        .from('Respondent')
        .innerJoin('Main', 'Main.ResponseID', '=', 'Respondent.ResponseID')
        .innerJoin('SocialMedia', 'SocialMedia.SocialMediaPlatformID', '=', 'Main.SocialMediaPlatformID')
        .innerJoin('Organization', 'Organization.OrganizationAffiliationID', '=', 'Main.OrganizationAffiliationID')
        .then(chicks => {
            // adminRecords is a html page that it shows the table, the second parameter is the data
            res.render("adminRecords", { adminInfo: chicks });
        })
});




//Search record on the admin records page
app.get("/adminRecords/:ResponseID", (req, res) => {

    const parameterFromPage = parseInt(req.query.ResponseID)
    knex
        .select('*')
        .from('Respondent')
        .innerJoin('Main', 'Main.ResponseID', '=', 'Respondent.ResponseID')
        .innerJoin('SocialMedia', 'SocialMedia.SocialMediaPlatformID', '=', 'Main.SocialMediaPlatformID')
        .innerJoin('Organization', 'Organization.OrganizationAffiliationID', '=', 'Main.OrganizationAffiliationID')
        .where('Respondent.ResponseID', parameterFromPage)
        .then(specificGuy => {
            res.render("searchResults", { Dude: specificGuy });

        }).catch(err => {
            console.log(err);
            res.status(500).json({ err });

        });
});

// ***********************************************USER RELATED PATHS******************************************

app.get("/userRecords", (req, res) => {
    knex.select('*')
        .from('Respondent')
        .innerJoin('Main', 'Main.ResponseID', '=', 'Respondent.ResponseID')
        .innerJoin('SocialMedia', 'SocialMedia.SocialMediaPlatformID', '=', 'Main.SocialMediaPlatformID')
        .innerJoin('Organization', 'Organization.OrganizationAffiliationID', '=', 'Main.OrganizationAffiliationID')
        .then(chicks => {
            // adminRecords is a html page that it shows the table, the second parameter is the data
            res.render("userRecords", { userInfo: chicks });
        })
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

    if (username === "admin" && password === "admin123") {
        res.redirect('adminLanding');
        return;
    }

    knex("user").where("username", username).andWhere("password", password).returning("user_id").then((response) => {

        if (response.length == 0) {
            res.redirect("badLogin");
            return;
        }

        res.redirect("userLanding");
    });




    // else if (knex("user").where("username", username) && knex("user").where("password", password)) {
    //     res.redirect("userLanding");
    // }
    // else {
    //     res.redirect("login");
    // }
});

app.get("/findUsername", (req, res) => {
    res.render("findUsername", {});
});

app.post("/createAccount", (req, res) => {
    knex("user").insert({ username: req.body.username, password: req.body.password }).then(users => {
        res.redirect("/login");
    }).catch(err => {
        console.log(err);
        res.status(500).json({ err });
    });
});

app.post("/findUsername", (req, res) => {
    knex.select().from("user").where("username", req.body.username).then(user => {
        res.render("modifyAccount", { users: user })
    });
});

app.post("/modifyAccount", (req, res) => {
    knex("user").where("user_id", parseInt(req.body.user_id)).update({
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

app.get("/userLanding", (req, res) => {
    res.render("userLanding", {});
});

// **************************************SURVEY RELATED PATHS****************************************

app.get("/survey", (req, res) => {
    res.render("survey", {});
});

app.post("/survey", (req, res) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeWithoutTimezone = `${hours}:${minutes}:${seconds}`;
    // Insert data into the Respondent table
    knex("Respondent")
        .insert(
            {
                Origin: 'Provo',
                Date: new Date().toISOString(),
                Time: timeWithoutTimezone,
                Age: req.body.age,
                Gender: req.body.gender,
                RelationshipStatus: req.body.relationshipStatus,
                OccupationStatus: req.body.occupation,
                SocialMediaUse: req.body.mediaUsage,
                HoursOnSocialMedia: req.body.time,
                SocialMediaWithoutPurpose: parseInt(req.body.noPurpose),
                DistractedBySocialMedia: parseInt(req.body.distracted),
                RestlessWithoutSocialMedia: parseInt(req.body.restless),
                EasilyDistractedScale: parseInt(req.body.youDistracted),
                BotheredByWorriesScale: parseInt(req.body.worries),
                DifficultyConcentrating: parseInt(req.body.concentrate),
                CompareSelfOnSocialMedia: parseInt(req.body.compare),
                FeelingsAboutComparisons: parseInt(req.body.compare),
                SeekValidationFrequency: parseInt(req.body.validation),
                FeelingsOfDepression: parseInt(req.body.depressed),
                InterestFluctuationScale: parseInt(req.body.interest),
                SleepIssuesScale: parseInt(req.body.sleep)
            }).returning("ResponseID")
        .then((response) => {
            // Redirect to same page after the survey has been inserted
            const ResponseID = response[0].ResponseID

            req.body.platform.forEach(platform => {
                knex("Main")
                    .insert({
                        ResponseID: ResponseID,
                        SocialMediaPlatformID: platform,
                        OrganizationAffiliationID: req.body.organization
                    }).then(() => {
                        res.redirect("/thanks");
                    })
            })

        })

})

// Route to the thank you page
app.get("/thanks", (req,res) => {
    res.render('thankyouSurvey');
});

// **********************************************CRUD***********************************************
// Add a new route for deletion
app.post("/deleteRecord/:ResponseId", (req, res) => {
    const responseId = req.params.ResponseId;

    // Perform deletion based on ResponseID
    knex("Main")
        .where({ "ResponseID": responseId })
        .del()
        .then(() => {
            // You may want to add additional logic to delete related records in other tables
            // ...
            knex("Respondent").where({ "ResponseID": responseId }).del().then(() => {
                res.redirect("/adminRecords");
            })
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Internal Server Error");
        });
});

app.get("/editRecord/:ResponseID", (req, res) => {
    const ResponseID = req.params.ResponseID;
    knex.select(
        "Age", "Gender", "RelationshipStatus", "OccupationStatus")
        .from("Respondent").where("ResponseID", ResponseID).then(Dude => {
            res.render("editRecord", { Dude: Dude, ResponseID: ResponseID })
        }).catch(err => {
            console.log(err);
            res.status(500).json({ err });
        })
});
app.post("/editRecord/:ResponseID", (req, res) => {
    const ResponseID = req.params.ResponseID;
    // Update the user information
    knex("Respondent")
        .where("ResponseID", ResponseID)
        .update({
            Age: parseInt(req.body.age),
            Gender: req.body.gender,
            RelationshipStatus: req.body.relationshipStatus,
            OccupationStatus: req.body.occupation
        })
        .then(updatedUserInfo => {
            // Render the editUser view with the updated user information
            res.render("index", { ResponseID: ResponseID });
        }).catch(err => {
            console.log(err);
            res.status(500).json({ err });
        });
});


// ***********************************************************DASHBOARD PATHS *******************************************************
// Route to the dashboard page
app.get("/dashboard", (req,res) => {
    res.render('dashboard');
});

// Start the server listening (do it at the bottom)
app.listen( port, () => console.log("Server is listening"));
