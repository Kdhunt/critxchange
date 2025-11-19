const servicesCatalog = require('../data/services');

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

    /**
     * Render account administration page
     */
    static renderAccountAdministration(req, res) {
        try {
            res.render('account-admin', {
                title: 'Account Administration',
                description: 'Manage your CritXChange profile and security preferences',
                user: req.user || null,
            });
        } catch (err) {
            console.error('Error rendering account administration page:', err);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * Render profile manager page
     */
    static renderProfileManager(req, res) {
        try {
            res.render('profile-manager', {
                title: 'Profile Manager',
                description: 'Shape your public author services profile',
                user: req.user || null,
                services: servicesCatalog,
            });
        } catch (err) {
            console.error('Error rendering profile manager page:', err);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = PageController;
