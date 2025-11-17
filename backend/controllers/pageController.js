const optionalAuth = require('../middleware/optionalAuth');

/**
 * Page Controller
 * Handles page rendering (home, about, etc.)
 */
class PageController {
    /**
     * Render home page
     */
    static renderHome(req, res) {
        try {
            res.render('index', {
                title: 'Home',
                user: req.user || null,
            });
        } catch (err) {
            console.error('Error rendering home page:', err);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * Render about page
     */
    static renderAbout(req, res) {
        try {
            res.render('about', {
                title: 'About',
                user: req.user || null,
            });
        } catch (err) {
            console.error('Error rendering about page:', err);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = PageController;
