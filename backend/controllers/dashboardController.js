/**
 * Dashboard Controller
 * Handles dashboard-related business logic
 */
class DashboardController {
    /**
     * Render dashboard page
     */
    static async renderDashboard(req, res) {
        try {
            res.render('dashboard', {
                title: 'Dashboard',
                user: req.user,
            });
        } catch (err) {
            console.error('Error rendering dashboard:', err);
            res.redirect('/auth/login?error=dashboard_error');
        }
    }

    /**
     * Handle logout
     */
    static logout(req, res) {
        // Clear cookie
        res.clearCookie('token');

        // Clear session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });
        }

        res.json({ message: 'Logged out successfully' });
    }
}

module.exports = DashboardController;
