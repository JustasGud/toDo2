const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin:admin@cluster0.uxa2n.mongodb.net/todolistDB"
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Wake up",
});
const item2 = new Item({
  name: "Drink coffe",
});
const item3 = new Item({
  name: "Exercise",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //ADDING DEFAULT ITEMS
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved!");
        }
      });
      res.redirect("/");
    } else if (err) {
      console.log(err);
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItenId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItenId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItenId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});
// CREATING NEW LISTS BY THE ENTERED URL EXTENTION
app.get("/:pageName", function (req, res) {
  const customPageName = _.capitalize(req.params.pageName);

  List.findOne(
    {
      name: customPageName,
    },
    function (err, existingList) {
      if (!err) {
        if (!existingList) {
          //create new list
          const list = new List({
            name: customPageName,
            items: defaultItems,
          });

          list.save();
          res.redirect("/" + customPageName);
        } else {
          //show existing list
          res.render("list", {
            listTitle: existingList.name,
            newListItems: existingList.items,
          });
        }
      }
    }
  );
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
