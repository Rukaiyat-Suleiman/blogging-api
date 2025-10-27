const express = require("express");
const router = express.Router();
const methodOverride = require('method-override');

const authenticate = require("../auth/auth-middleware");
const Blog = require("../models/Blog");

router.use(methodOverride('_method'));

router.get('/blogs/create', authenticate, (req, res) => {
    res.render('create-blog');
});

router.get('/blogs/:id/edit', authenticate, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).render('error', { message: 'Blog not found' });
        }
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { message: 'Not authorized to edit this blog' });
        }
        res.render('edit-blog', { blog: blog });
    } catch (error) {
        res.status(500).render('error', { message: 'Error loading blog', error: error.message });
    }
});

router.post('/blogs', authenticate, async (req, res) => {
    try {
        const { title, content, state } = req.body;
        if (!title || !content) {
            return res.status(400).render('create-blog', { 
                error: 'Title and Content are required',
                title: title,
                content: content
            });
        }
        if (state !== 'draft' && state !== 'published') {
            return res.status(400).render('create-blog', {
                error: 'Invalid blog state',
                title: title,
                content: content
            });
        }
        const newBlog = new Blog({
            title: title,
            content: content,
            author: req.user._id,
            state: state
        });
        await newBlog.save();
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).render('create-blog', { 
            error: 'Error creating blog',
            title: req.body.title,
            content: req.body.content
        });
    }
});

router.put('/blogs/:id', authenticate, async (req, res) => {
    try {
        const { title, content, state } = req.body;
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).render('error', { message: 'Blog not found' });
        }
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { message: 'Not authorized to edit this blog' });
        }
        if (state !== 'draft' && state !== 'published') {
            return res.status(400).render('single-blog', {
                blog: { ...req.body, _id: blog._id },
                error: 'Invalid blog state'
            });
        }
        blog.title = title;
        blog.content = content;
        blog.state = state;
        await blog.save();
        res.redirect('/');
    } catch (error) {
        res.status(500).render('single-blog', { 
            blog: { ...req.body, _id: req.params.id },
            error: 'Error updating blog'
        });
    }
});

router.delete('/blogs/:id', authenticate, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this blog' });
        }
        await blog.deleteOne();
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const searchQuery = req.query.search || '';
        const sortBy = req.query.sort || 'createdAt';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;
        const filterBy = req.query.filter || 'all';

        let query = { state: 'published' };
        
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        if (filterBy === 'recent') {
            query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (filterBy === 'popular') {
            query.readCount = { $gt: 0 };
        }

        const skip = (page - 1) * limit;
        
        const total = await Blog.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const blogs = await Blog.find(query)
            .populate('author', 'first_name last_name')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        const filterOptions = {
            all: 'All Posts',
            recent: 'Recent Posts (Last 7 days)',
            popular: 'Popular Posts'
        };

        const sortOptions = {
            createdAt: 'Date',
            readCount: 'Reads',
            readingTime: 'Read Time'
        };

        res.render('all-blogs', { 
            user: req.user,
            blogs,
            pagination: {
                page,
                limit,
                total,
                totalPages
            },
            search: searchQuery,
            sort: sortBy,
            order: sortOrder,
            filter: filterBy,
            filterOptions,
            sortOptions
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching blogs', error: error.message });
    }
});

router.get('/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'first_name last_name');
        if (!blog) {
            return res.status(404).render('error', { message: 'Blog not found' });
        }
        blog.readCount = blog.readCount + 1;
        await blog.save();
        res.render('single-blog', { blog: blog });
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching blog', error: error.message });
    }
});

module.exports = router;