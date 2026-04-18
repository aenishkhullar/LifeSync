// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
    try {
        const user = req.user;

        if (user) {
            res.json({
                success: true,
                data: user,
            });
        } else {
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        next(error);
    }
};

export { getUserProfile };
