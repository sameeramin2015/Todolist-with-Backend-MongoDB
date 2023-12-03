//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create mongodDB by the name of todolistDB
mongoose.connect("mongodb://localhost:27017/todolistDB");
// create new schema for the database
const itemsSchema = {
  name: String,
};
// create model and specifying our collection name Item = items
const Item  = mongoose.model(
  "Item",
  itemsSchema
);

// create new documents
const item1 = new Item ({
  name: "Welcome to your todolist"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item. "
});

// put documents in to an array
const defaultItems = [item1, item2, item3];

// create schema
const ListSchema = {
  name: String,
  items:[itemsSchema]
}
 // create model
 const List = mongoose.model("List", ListSchema);

app.get("/", function(req, res) {

  
  Item.find({})
  .then(function (foundItems) {
    if(foundItems.length === 0){
    
      // insert items in to the Item collection
      Item.insertMany(defaultItems)
      .then(function () {
      console.log("Successfully saved defult items to DB.");
   })
  .catch(function (err) {
   console.log(err);
   });
   res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  })
  .catch(function (err) {
    console.log(err);
  });
 //-----------------------------------------------------
 

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  // check the item if it is exit in the list
  List.findOne({name: customListName})
  .then(function(foundList){
    if(!foundList){
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      // save it to list collection
      list.save();
      res.redirect("/")
    } else {
      // show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(function (err) {
    console.log(err);
  });

  
});
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // create new model 
  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
  // save items to mongoDB
  item.save()
  res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
});
app.post("/delete", function(req, res){
 const checkedItemId = req.body.checkbox;
 const listName = req.body.listName;

 if(listName === "Today"){
  Item.findByIdAndDelete(checkedItemId)
  .then(function () {
   console.log("item has been deleted");
   res.redirect("/");
 })
 .catch(function (err) {
 console.log(err);
 });
 }else {
  List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}})
  .then(function(foundList){
    res.redirect("/" + listName);
  })
  .catch(function (err) {
    console.log(err);
    });
 }

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
