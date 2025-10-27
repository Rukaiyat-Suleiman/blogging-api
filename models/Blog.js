const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({ 
    title: {
        type: String,
        required: [true, "Title is required"],
        min: [5, 'Too short'],
        trim: true
    },
    content: {
        type: String,
        required: [true, "Content is required"]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Author is required"]
    },
    state: {
        type: String,
        enum: ["draft", "published"],
        default: "draft"
    },
    readCount: {
        type: Number,
        default: 0
    },
    readingTime: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

blogSchema.pre("save", function(next) {
    if (this.content) {
        const words = this.content.trim().split(" ");
        const wordCount = words.length;
        this.readingTime = Math.ceil(wordCount / 238);
    }
    next();
});

module.exports = mongoose.model("Blog", blogSchema);