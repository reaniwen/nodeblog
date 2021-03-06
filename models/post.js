var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, title, post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
	var date = new Date();

	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minutes: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
	}

	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post,
		comments: []
	};
	// open db
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
	
	// read posts collections
	db.collection('posts', function (err, collection) {
		if (err) {
			mongodb.close();
			return callback(err);
		}
		// insert post into posts collecions
		collection.insert(post, {
			safe: true
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);//返回 err 为 null
			});
		});
	});
};

//get posts
Post.getAll = function(name, callback) {
	//open db
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		// read posts collections
		db.collection('posts', function(err, collection) {
		if (err) {
			mongodb.close();
			return callback(err);
		}
		var query = {};
		if (name) {
			query.name = name;
		}
		// query post
		collection.find(query).sort({
			time: -1
			}).toArray(function (err, docs) {
			mongodb.close();
			if (err) {
				return callback(err);
			}

			// parse the markdown to html
			docs.forEach(function (doc) {
				doc.post = markdown.toHTML(doc.post);
			});
			callback(null, docs);//成功！以数组形式返回查询的结果
			});
		});
	});
};

Post.getOne = function(name, day, title, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				mongodb.close();
				if(err) {
					return callback(err);
				}

				// doc.post = markdown.toHTML(doc.post);
				if (doc) {
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment) {
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null, doc);
			});
		});
	});
};

// Edit an article
Post.edit = function(name, day, title, callback) {
	mongodb.open(function (err, db) {
		if(err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			// query the article
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title,
			}, function(err, doc) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

// Update an article
Post.update = function(name, day, title, post, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
		if (err) {
			mongodb.close();
			return callback(err);
		}
		// update article
		collection.update({
			"name": name,
			"time.day": day,
			"title": title
		}, {
			$set: {post: post}
		}, function (err) {
			mongodb.close();
			if (err) {
				return callback(err);
			}
			callback(null);
			});
		});
	});
};

// Delete an article
Post.remove = function(name, day, title, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
		//根据用户名、日期和标题查找并删除一篇文章
		collection.remove({
			"name": name,
			"time.day": day,
			"title": title
		}, {
			w: 1
		}, function (err) {
			mongodb.close();
			if (err) {
				return callback(err);
			}
			callback(null);
			});
		});
	});
};