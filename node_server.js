var express = require('express');
var app = express();

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

var request = require('request');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8666);

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'mysql.eecs.oregonstate.edu',
  user: 'cs340_jonest3',
  password: '2302',
  database: 'cs340_jonest3',
});

app.post('/viewMeal', function(req, res, next){
  var context = {};
  var request = req.body;

  //if request body contains a meal_id value, query all attributes of that meal
    if (request.id) {
        pool.query("SELECT `meal_id`, `name`, `description`, `genre`, `prep_time`, `image`, `username_id`, `restaurant_id` FROM meals WHERE `meal_id` = ?", [request.id], function(err, rows, fields){

            if (err){
              next(err);
              return;
            }

            //save meal information to meal property
            context.meal = rows[0];
            console.log(context.meal);

            pool.query("SELECT `ingredient_id`, `meal_id` FROM contains WHERE `meal_id` = ?", [request.id], function(err, rows, fields){

                if (err) {
                    next(err);
                    return;
                }

                context.activeIngredients = rows;
                //console.log(context.activeIngredients);

                pool.query("SELECT `ingredient_id`, `name`, `type` FROM ingredients", function(err, rows, fields){

                    if (err) {
                        next(err);
                        return;
                    }

                    context.ingredientsTable = rows;
                    //console.log(context.ingredientsTable);
                    context.activeIngredientsName = [];

                    var restaurantInfo = context.meal
                    //console.log(restaurantInfo.restaurant_id);

                    for (x = 0; x < context.activeIngredients.length; x++) {

                        for (y = 0; y < context.ingredientsTable.length; y++) {

                            if (context.activeIngredients[x].ingredient_id == context.ingredientsTable[y].ingredient_id) {

                                context.activeIngredientsName.push(context.ingredientsTable[y].name);
                            }
                        }
                    }

                    console.log(context.activeIngredientsName);

                    if (Number.isInteger(restaurantInfo.restaurant_id)) {
                        pool.query("SELECT `restaurant_id`, `name`, `street_name`, `city`, `state`, `zipcode` FROM restaurants WHERE `restaurant_id` = ?", [restaurantInfo.restaurant_id], function(err, rows, fields){

                            if (err) {
                              next(err);
                              return;
                            }

                            context.restaurant = rows[0];

                            /******************************
                            *ADD LOGIC HERE TO SERVER DIFFERENT
                            *PAGE IF USER IS ORIGINAL MEAL CREATOR (AND SIGNED IN)
                            ******************************/
                            //render view page for user
                            res.render('view_meal_creator', context);

                            //if user is not original recipe creator render page without delete link
                            //res.render('view_meal_browser', context);
                        });
                    } else {

                        //res.type(`text/plain`);
                        //res.send(context);
                        console.log(context);

                        /******************************
                        *ADD LOGIC HERE TO SERVER DIFFERENT
                        *PAGE IF USER IS ORIGINAL MEAL CREATOR (AND SIGNED IN)
                        ******************************/
                        //render view page for user
                        res.render('view_meal_creator', context);

                        //if user is not original recipe creator render page without delete link
                        //res.render('view_meal_browser', context);
                    }
                });
            });
        });
    }
});

app.get('/remove/meal', function(req, res, next){
  var context = {};

  var query_params = req.query;

  if (req.query.id) {
    //query the record to be edited, so we can prepopulate the form inputs with the current record attribute values
    pool.query("DELETE FROM meals WHERE `meal_id` = ?", [req.query.id], function(err, rows, fields){

      if (err){
        next(err);
        return;
      }
      //change success to true for evaluation client side
      if (rows.affectedRows == 1) {
          context.delete_success = true;
          //console.log("its true");
      } else {
          context.delete_success = false;
          //console.log("its false");
      }

      //send feedback to the user
      if (context.delete_success == true) {
          res.render('delete_success', context);
      } else {
          res.render('delete_failure', context);
      }
    });
  }
});

app.use(function(req,res){
        res.status(404);
        res.render('404');
});

app.use(function(err, req, res, next){
        console.error(err.stack);
        res.status(500);
        res.render('500');
});

app.listen(app.get('port'), function(){
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
