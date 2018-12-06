const path = require('path');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'views'));
const admin = require('firebase-admin');
admin.initializeApp({
	credential: admin.credential.applicationDefault()
});
var db = admin.firestore();
app.locals.siteName = "Vegetable World";

function insertVisit(visit) {
	return db.collection('visitors').add({
		timestamp: visit.timestamp,
		userIp: visit.userIp,
	});
}

function getUsers() {
	return db.collection('users').get().then((snapshot) => {
			/*
			snapshot.forEach((doc) => {
				console.log(doc.id, '=>', doc.data()); // get attribute with doc.data().firstName
			});
			*/
			return snapshot.docs.map((doc) => `First Name: ${doc.data().firstName}, Last Name: ${doc.data().lastName}, Birth Year: ${doc.data().birthYear}`);;
		})
		.catch((err) => {
			console.log('Error getting documents', err);
	});
}

// Show the simple index page when the user browses to /
app.get('/', (req, res, next) => {
	const visit = {
		timestamp: new Date(),
		userIp: crypto
			.createHash('sha256')
			.update(req.ip)
			.digest('hex')
			.substr(0, 7),
	};

	insertVisit(visit)
		.then(() => getUsers())
		.then((users) => {
			res
				.set(200)
				.render("homepage", {
			        user: req.user,
			        vegetables: [
			            "carrot",
			            "potato",
			            "beet"
			        ],
			        userList: users,
			        
		    	})
		    	.end();
	    	//.send(`All users:\n${users.join('\n')}`)
		})
		.catch(next);
    
});

// Show the form when the user browses to /submit
app.get('/submit', (req, res) => {
	res.sendFile(path.join(__dirname, '/views/form.html'));
});

// Add a POST handler to read the data
app.post('/submit', (req, res) => {
	var addDoc = db.collection('users').add({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		birthYear: req.body.birthYear,
	});
	res.send('<a href="../">Back</a>');
});


/* rendering a page after async operations
router.get("/", (req, res) => {
    return Promise.try(() => {
        return db("vegetables").limit(3);
    }).map((row) => {
        return row.name;
    }).then((vegetables) => {
        res.render("homepage", {
            vegetables: vegetables
        });
    });
});
// Update an existing document.
document.update({
  body: 'My first Firestore app',
}).then(() => {
  // Document updated successfully.
});
 */

// Listen to the App Engine -specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server listening on port ${PORT}...');
});
